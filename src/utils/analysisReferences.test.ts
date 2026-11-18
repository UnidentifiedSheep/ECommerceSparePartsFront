import { describe, expect, it } from 'vitest'
import { analysisReference } from './analysisReferences'
import type { AnalysisDataPoint } from '@/services/api/analytics'

const point: AnalysisDataPoint = { value: { subject: 7, customer: 'org-1', buyer: 'user-1' }, references: [
  { field: 'subject', entity: 'Product', target: { __typename: 'Product', productId: 7, sku: 'AB-12', name: 'Filter', producer: { name: 'MAN' } } },
  { field: 'customer', entity: 'Organization', target: { __typename: 'Organization', organizationId: 'org-1', name: 'Company' } },
  { field: 'buyer', entity: 'User', target: { __typename: 'User', userId: 'user-1', userName: 'user', info: { name: 'Ada', surname: 'Lovelace' } } },
] }
describe('chart field references', () => {
  it('renders products under arbitrary field names and links to the referenced entity', () => {
    expect(analysisReference(point, 'subject', 7)).toEqual({ label: 'AB-12', description: 'MAN · Filter', to: { name: 'product-details', params: { id: 7 } } })
    expect(analysisReference(point, 'customer', 'org-1')).toMatchObject({ label: 'Company', to: { name: 'organizations', query: { organizationId: 'org-1' } } })
    expect(analysisReference(point, 'buyer', 'user-1')).toMatchObject({ label: 'Ada Lovelace', to: { name: 'users', query: { userId: 'user-1' } } })
  })
  it('does not guess references by equal IDs, conventional field names or mismatched keys', () => {
    expect(analysisReference(point, 'productId', 7)).toBeNull()
    expect(analysisReference(point, 'count', 7)).toBeNull()
    expect(analysisReference(point, 'subject', 8)).toBeNull()
    expect(analysisReference({ value: {}, references: [{ field: 'productId', entity: 'Product', target: { __typename: 'Product' } }] }, 'productId', 7)).toBeNull()
  })
})
