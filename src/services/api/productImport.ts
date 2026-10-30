import type { Supplier } from '@/models/producerModel'
import { graphqlClient } from '@/services/graphql/client'
import { operationRequest } from '@/services/graphql/operationErrors'
import { ResolveProductReferencesDocument, type Supplier as GqlSupplier } from '@/graphql/generated/graphql'

export interface ImportProductReference { sku: string; producerName: string; supplier: Supplier | null }
const suppliers = { Armtek: 'ARMTEK', FavoritParts: 'FAVORIT_PARTS', Tmtr: 'TMTR' } as const satisfies Record<Supplier, GqlSupplier>

export async function resolveImportReferences(references: ImportProductReference[]) {
  const { data } = await operationRequest(graphqlClient.query({
    query: ResolveProductReferencesDocument,
    variables: { references: references.map(reference => ({ ...reference, supplier: reference.supplier ? suppliers[reference.supplier] : null })) },
    fetchPolicy: 'no-cache',
  }))
  return data.products.resolve
}
