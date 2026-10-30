import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getProductsAvailableStock } from '@/services/api/products'
import { loadSelectionStock } from './productSelection'

vi.mock('@/services/api/products', () => ({ getProductsAvailableStock: vi.fn() }))
const products = [{ id: 1, sku: 'A', name: 'A', producerId: 1, stock: 100 },
  { id: 2, sku: 'B', name: 'B', producerId: 1, stock: 200 }]

describe('warehouse stock in product selection', () => {
  beforeEach(() => vi.resetAllMocks())

  it('loads selected warehouse availability in one batch and never substitutes total stock', async () => {
    vi.mocked(getProductsAvailableStock).mockResolvedValue(new Map([[1, 3]]))
    const result = await loadSelectionStock(products, 'SECOND')
    expect(getProductsAvailableStock).toHaveBeenCalledExactlyOnceWith([1, 2], 'SECOND')
    expect(result.map(product => product.availableStock)).toEqual([3, 0])
    expect(result.map(product => product.stock)).toEqual([100, 200])
    expect(products[0]).not.toHaveProperty('availableStock')
  })

  it('keeps catalogue and purchase selection independent of availability requests', async () => {
    expect(await loadSelectionStock(products)).toBe(products)
    expect(await loadSelectionStock([], 'MAIN')).toEqual([])
    expect(getProductsAvailableStock).not.toHaveBeenCalled()
  })

  it('does not present total stock as available stock when the request fails', async () => {
    vi.mocked(getProductsAvailableStock).mockRejectedValue(new Error('Unavailable'))
    await expect(loadSelectionStock(products, 'MAIN')).rejects.toThrow('Unavailable')
  })
})
