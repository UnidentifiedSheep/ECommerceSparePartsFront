import { mapUserModel, type UserDto, type UserModel } from '@/models/userModel.ts'

export type OrganizationType = 'Individual' | 'Business' | 'System'
export type OrganizationRole = 'Owner' | 'Admin' | 'Manager' | 'Member'

export interface OrganizationModel {
  id: string
  type: OrganizationType
  name: string
  systemName: string
  isHidden: boolean
  owner: OrganizationMemberModel
  approximateBalanceInBaseCurrency?: number | null
}

export interface OrganizationMemberModel {
  organizationId: string
  role: OrganizationRole
  user: UserModel
}

export interface OrganizationSelection {
  organization: OrganizationModel
  member?: OrganizationMemberModel
}

export interface OrganizationDto extends Omit<OrganizationModel, 'owner' | 'approximateBalanceInBaseCurrency'> {
  owner: Omit<OrganizationMemberModel, 'user'> & {
    user: UserDto
  }
}

export interface OrganizationListItemDto extends OrganizationDto {
  approximateBalanceInBaseCurrency: number | null
}

export function mapOrganizationModel(dto: OrganizationDto): OrganizationModel {
  return {
    ...dto,
    isHidden: dto.isHidden,
    owner: {
      ...dto.owner,
      user: mapUserModel(dto.owner.user),
    },
  }
}

export function mapOrganizationListItemModel(dto: OrganizationListItemDto): OrganizationModel {
  return {
    ...mapOrganizationModel(dto),
    approximateBalanceInBaseCurrency: dto.approximateBalanceInBaseCurrency,
  }
}
