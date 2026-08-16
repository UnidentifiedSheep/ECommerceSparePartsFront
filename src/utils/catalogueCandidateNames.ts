import type { CatalogueCandidateReviewModel } from '@/models/catalogueCandidateModel.ts'
import type { Supplier } from '@/models/producerModel.ts'

export interface CatalogueNameUsage {
  supplierProductId: number
  supplier: Supplier
  sku: string
  producer: string
}

export interface CatalogueNameGroup {
  name: string
  usages: CatalogueNameUsage[]
}

export function groupCatalogueCandidateNames(
  candidates: readonly CatalogueCandidateReviewModel[],
): CatalogueNameGroup[] {
  const groups = new Map<string, CatalogueNameGroup>()

  for (const candidate of candidates) {
    for (const supplierProduct of candidate.supplierProducts) {
      for (const item of supplierProduct.names) {
        const name = item.name.trim()
        if (!name) continue

        const key = name.toLocaleLowerCase()
        const group = groups.get(key) ?? { name, usages: [] }
        if (!groups.has(key)) groups.set(key, group)

        if (!group.usages.some((usage) => usage.supplierProductId === supplierProduct.id)) {
          group.usages.push({
            supplierProductId: supplierProduct.id,
            supplier: supplierProduct.supplier,
            sku: supplierProduct.sku,
            producer: supplierProduct.producer,
          })
        }
      }
    }
  }

  return [...groups.values()].sort((left, right) => (
    right.usages.length - left.usages.length
    || left.name.localeCompare(right.name)
  ))
}
