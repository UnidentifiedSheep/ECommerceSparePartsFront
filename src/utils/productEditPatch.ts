import type { EditProductRequest } from '@/services/api/products'

export interface ProductEditValues {
  sku: string
  name: string
  producerId?: number
  groupId?: number | null
  description?: string | null
  indicator?: string | null
}

export function normalizeProductEdit(values: ProductEditValues) {
  return {
    sku: values.sku.trim(), name: values.name.trim(), producerId: values.producerId,
    groupId: values.groupId ?? null,
    description: values.description?.trim() || null,
    indicator: values.indicator || null,
  }
}

export function buildProductEditPatch(id: number, initial: ProductEditValues, edited: ProductEditValues): EditProductRequest {
  const before = normalizeProductEdit(initial), after = normalizeProductEdit(edited)
  const patch: EditProductRequest = { id }
  for (const key of Object.keys(after) as Array<keyof typeof after>) {
    if (before[key] !== after[key]) Object.assign(patch, { [key]: after[key] })
  }
  return patch
}
