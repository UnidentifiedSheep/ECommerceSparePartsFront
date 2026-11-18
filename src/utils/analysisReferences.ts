import type { RouteLocationRaw } from 'vue-router'
import type { AnalysisDataPoint } from '@/services/api/analytics'

export interface AnalysisReferenceLabel { label: string; description?: string; to: RouteLocationRaw }

// References belong to a particular field of this row, not to every matching ID.
export function analysisReference(point: AnalysisDataPoint, field: string, value: unknown): AnalysisReferenceLabel | null {
  const reference = point.references.find(item => item.field === field && item.entity === item.target.__typename)
  const target = reference?.target
  if (target?.__typename === 'Product' && target.productId === value && target.productId != null && target.sku != null) {
    return { label: target.sku, description: [target.producer?.name, target.name].filter(Boolean).join(' · '), to: { name: 'product-details', params: { id: target.productId } } }
  }
  if (target?.__typename === 'Organization' && target.organizationId === value && target.organizationId && target.name != null) {
    return { label: target.name, to: { name: 'organizations', query: { organizationId: target.organizationId } } }
  }
  if (target?.__typename === 'User' && target.userId === value && target.userId && target.userName != null) {
    return { label: [target.info?.name, target.info?.surname].filter(Boolean).join(' ') || target.userName, description: target.userName, to: { name: 'users', query: { userId: target.userId } } }
  }
  return null
}
