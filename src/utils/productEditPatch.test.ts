import { describe, expect, it } from 'vitest'
import { buildProductEditPatch } from './productEditPatch'

const original = { sku: 'ABC-123', name: 'Original name', producerId: 5, groupId: 2, description: 'Description', indicator: '#fff' }
describe('product edit patches', () => {
  it('sends only the changed field so concurrent updates of other fields are preserved', () => {
    expect(buildProductEditPatch(1, original, { ...original, name: 'New name' })).toEqual({ id: 1, name: 'New name' })
  })
  it('keeps explicit clearing distinct from untouched nullable fields', () => {
    expect(buildProductEditPatch(1, original, { ...original, groupId: undefined, description: '', indicator: null })).toEqual({ id: 1, groupId: null, description: null, indicator: null })
  })
  it('does not send a patch for whitespace-only changes or values restored before saving', () => {
    expect(buildProductEditPatch(1, original, { ...original, sku: ' ABC-123 ', description: ' Description ' })).toEqual({ id: 1 })
    expect(buildProductEditPatch(1, { ...original, description: null, groupId: undefined }, { ...original, description: '', groupId: null })).toEqual({ id: 1 })
  })
  it('can update multiple changed fields without including untouched ones', () => {
    expect(buildProductEditPatch(1, original, { ...original, sku: 'NEW-123', producerId: 7 })).toEqual({ id: 1, sku: 'NEW-123', producerId: 7 })
  })
})
