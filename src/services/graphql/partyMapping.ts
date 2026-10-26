import type { OrganizationFieldsFragment, UserSummaryFieldsFragment, SortByInput } from '@/graphql/generated/graphql'
import { mapUserModel } from '@/models/userModel'
import type { OrganizationModel } from '@/models/organizationModel'

export function mapGqlUser(user: UserSummaryFieldsFragment) {
  return mapUserModel({ ...user, userInfo: user.info ? { ...user.info, description: user.info.description ?? undefined } : null })
}

export function mapGqlOrganization(org: OrganizationFieldsFragment): OrganizationModel {
  const types = { INDIVIDUAL: 'Individual', BUSINESS: 'Business', SYSTEM: 'System' } as const
  return {
    ...org,
    type: types[org.type],
    owner: { organizationId: org.id, role: 'Owner', user: mapGqlUser(org.owner) },
  }
}

export function gqlSort(expressions?: string[]): SortByInput[] | undefined {
  return expressions?.map(expression => ({
    field: expression.replace(/^[+-]/, '').replace(/_(asc|desc)$/, ''),
    isDescending: expression.startsWith('-') || expression.endsWith('_desc'),
  }))
}
