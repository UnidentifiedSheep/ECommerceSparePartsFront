import { mapUserModel, type UserDto, type UserModel } from '@/models/userModel.ts'

export type OrganizationType = 'Individual' | 'Business' | 'System'
export type OrganizationRole = 'Owner' | 'Admin' | 'Manager' | 'Member'

export interface OrganizationModel {
  id: string
  type: OrganizationType
  name: string
  systemName: string
  owner: OrganizationMemberModel
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

export interface OrganizationDto extends Omit<OrganizationModel, 'owner'> {
  owner: Omit<OrganizationMemberModel, 'user'> & {
    user: UserDto
  }
}

export function mapOrganizationModel(dto: OrganizationDto): OrganizationModel {
  return {
    ...dto,
    owner: {
      ...dto.owner,
      user: mapUserModel(dto.owner.user),
    },
  }
}
