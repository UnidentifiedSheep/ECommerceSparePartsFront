import type { Ref } from 'vue'
import type { OrganizationModel } from '@/models/organizationModel'
import type { ProductSearchModel } from '@/models/productSearchModel'
import { getOrganizations } from '@/services/api/organizations'
import { getProductById } from '@/services/api/products'
import { queryIds, queryStrings } from '@/utils/listQuery'
import type { QueryBinding } from './useListQueryState'

export function organizationQueryBinding<T>(target: Ref<T[]>, getOrganization: (item: T) => OrganizationModel, wrap: (organization: OrganizationModel) => T): QueryBinding {
  return {
    read: () => target.value.map((item) => getOrganization(item).id),
    async restore(value) {
      const ids = queryStrings(value)
      target.value = []
      if (!ids.length) return
      const { organizations } = await getOrganizations({ ids, page: 0, limit: 100, showHidden: true })
      target.value = organizations.map(wrap)
      if (organizations.length !== ids.length) throw new Error('Some organization filters are unavailable')
    },
  }
}
export function productQueryBinding(target: Ref<ProductSearchModel[]>): QueryBinding {
  return {
    read: () => target.value.map((product) => product.id),
    async restore(value) {
      target.value = []
      const outcomes = await Promise.allSettled(queryIds(value).map(async (id): Promise<ProductSearchModel> => {
        const { product } = await getProductById(id)
        if (!product) throw new Error('Product filter is unavailable')
        return { id: product.id, sku: product.sku, name: product.name, producerId: product.producerId, producerName: product.producerName, stock: product.stock }
      }))
      target.value = outcomes.flatMap((result) => result.status === 'fulfilled' ? [result.value] : [])
      if (outcomes.some((result) => result.status === 'rejected')) throw new Error('Some product filters are unavailable')
    },
  }
}
