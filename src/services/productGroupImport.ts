import { fullGroupLinkages, importProductKey, normalizedImportSku, ProductImportIssue, type ProductImportGroup, type ProductImportRow } from '@/models/productGroupImport'
import { resolveImportReferences } from '@/services/api/productImport'
import { createProducts, createProductCrosses } from '@/services/api/products'
import { getProducersByIdsGraphql } from '@/services/graphql/products'

export interface ImportProgress { group: number; phase: 'resolve' | 'create' | 'link' | 'done' }
export interface ImportAccess { canRead: () => boolean; canCreate: () => boolean; canLink: () => boolean }
interface LocatedRow { row: ProductImportRow; supplier: ProductImportGroup['supplier'] }
const batchSize = 100

function validateGroup(group: ProductImportGroup, access: ImportAccess, linkGroups: boolean) {
  if (group.rows.some(row => !row.producerId)) throw new ProductImportIssue('producer')
  if (group.rows.some(row => !row.productId && (row.name.trim().length < 3 || row.name.trim().length > 255))) throw new ProductImportIssue('name')
  if (group.rows.some(row => !row.productId) && !access.canCreate()) throw new ProductImportIssue('permissions')
  if (linkGroups && group.rows.length > 1 && !access.canLink()) throw new ProductImportIssue('permissions')
}

export async function resolveImportGroups(groups: ProductImportGroup[], progress?: (value: ImportProgress) => void) {
  const rows: LocatedRow[] = groups.filter(group => !group.done).flatMap(group => group.rows.map(row => ({ row, supplier: group.supplier })))
  const manualIds = [...new Set(rows.flatMap(({ row }) => row.manualProducerId === undefined ? [] : [row.manualProducerId]))]
  const producers = new Map<number, string>()
  for (let offset = 0; offset < manualIds.length; offset += batchSize) {
    for (const producer of await getProducersByIdsGraphql(manualIds.slice(offset, offset + batchSize))) producers.set(producer.id, producer.name)
  }
  for (let offset = 0; offset < rows.length; offset += batchSize) {
    const batch = rows.slice(offset, offset + batchSize)
    progress?.({ group: groups.findIndex(group => group.rows.includes(batch[0]!.row)), phase: 'resolve' })
    const references = batch.map(({ row, supplier }) => {
      if (row.manualProducerId !== undefined && !producers.has(row.manualProducerId)) throw new ProductImportIssue('producer')
      return { sku: row.sku, producerName: row.manualProducerId !== undefined ? producers.get(row.manualProducerId)! : row.producer, supplier: row.manualProducerId !== undefined ? null : supplier }
    })
    const resolved = await resolveImportReferences(references)
    if (resolved.length !== batch.length) throw new ProductImportIssue('resolve')
    resolved.forEach((result, index) => {
      const { row } = batch[index]!
      if (result.sku !== row.sku || result.producerName !== references[index]!.producerName
        || (row.manualProducerId !== undefined && result.producer?.id !== row.manualProducerId)) throw new ProductImportIssue('resolve')
      row.producerId = result.producer?.id
      row.producerLabel = result.producer?.name
      row.created = Boolean(row.created && row.productId === result.productId)
      row.productId = result.productId ?? undefined
      row.productName = result.product?.name
    })
  }
}

export async function executeProductImport(groups: ProductImportGroup[], access: ImportAccess, progress: (value: ImportProgress) => void, onWrite: () => void) {
  return executeImport(groups, access, progress, onWrite, true)
}

// Document positions are independent products, never a cross-reference group.
export async function executeProductCreation(groups: ProductImportGroup[], access: ImportAccess, progress: (value: ImportProgress) => void, onWrite: () => void) {
  return executeImport(groups, access, progress, onWrite, false)
}

async function executeImport(groups: ProductImportGroup[], access: ImportAccess, progress: (value: ImportProgress) => void, onWrite: () => void, linkGroups: boolean) {
  if (!access.canRead()) throw new ProductImportIssue('permissions')
  await resolveImportGroups(groups, progress)
  // Validate all pending groups before the first write.
  for (const group of groups.filter(item => !item.done)) {
    validateGroup(group, access, linkGroups)
  }
  for (let index = 0; index < groups.length; index++) {
    const group = groups[index]!
    if (group.done) continue
    group.error = ''
    try {
      // A previous group (or another user) may have created the same products.
      await resolveImportGroups([group])
      validateGroup(group, access, linkGroups)
      const missing = [...new Map(group.rows.filter(row => !row.productId).map(row => [importProductKey(row), row])).values()]
      for (let offset = 0; offset < missing.length; offset += batchSize) {
        const batch = missing.slice(offset, offset + batchSize).filter(row => !row.productId)
        if (!batch.length) continue
        if (!access.canCreate()) throw new ProductImportIssue('permissions')
        progress({ group: index, phase: 'create' })
        onWrite()
        try {
          const response = await createProducts({ newProducts: batch.map(row => ({ sku: row.sku, name: row.name.trim(), producerId: row.producerId! })) })
          if (response.products.length !== batch.length) throw new ProductImportIssue('resolve')
          if (response.products.some((product, itemIndex) => normalizedImportSku(product.sku) !== normalizedImportSku(batch[itemIndex]!.sku))) throw new ProductImportIssue('resolve')
          response.products.forEach((product, itemIndex) => {
            const key = importProductKey(batch[itemIndex]!)
            group.rows.filter(row => importProductKey(row) === key).forEach(row => { row.productId = product.id; row.productName = product.name; row.created = true })
          })
        } catch (error) {
          // Recover a committed request with a lost response or a concurrent create.
          await resolveImportGroups([group])
          if (batch.some(row => !row.productId)) throw error
        }
      }
      if (group.rows.some(row => !row.productId)) throw new ProductImportIssue('resolve')
      const linkages = linkGroups ? fullGroupLinkages(group.rows) : []
      if (linkages.length) {
        if (!access.canLink()) throw new ProductImportIssue('permissions')
        progress({ group: index, phase: 'link' })
        onWrite()
        await createProductCrosses({ linkages })
      }
      group.done = true
      progress({ group: index, phase: 'done' })
    } catch (error) {
      group.error = error instanceof Error ? error.message : ''
      throw error
    }
  }
}
