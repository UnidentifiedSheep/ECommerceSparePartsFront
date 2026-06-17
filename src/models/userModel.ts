export interface UserInfoModel {
  name: string
  surname: string
  description?: string
}

export interface UserModel {
  id: string
  userName: string
  normalizedUserName?: string
  createdAt?: string
  updatedAt?: string
  twoFactorEnabled?: boolean
  lockoutEnd?: string | null
  accessFailedCount?: number
  lastLoginAt?: string | null
  userInfo?: UserInfoModel | null
  name: string
  surname: string
  description?: string
  isSupplier?: boolean
}

export interface UserDto {
  id: string
  userName: string
  normalizedUserName?: string
  createdAt?: string
  updatedAt?: string
  twoFactorEnabled?: boolean
  lockoutEnd?: string | null
  accessFailedCount?: number
  lastLoginAt?: string | null
  userInfo?: UserInfoModel | null
  name?: string
  surname?: string
  description?: string
  isSupplier?: boolean
}

export function mapUserModel(dto: UserDto): UserModel {
  return {
    id: dto.id,
    userName: dto.userName,
    normalizedUserName: dto.normalizedUserName,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    twoFactorEnabled: dto.twoFactorEnabled,
    lockoutEnd: dto.lockoutEnd,
    accessFailedCount: dto.accessFailedCount,
    lastLoginAt: dto.lastLoginAt,
    userInfo: dto.userInfo,
    name: dto.userInfo?.name ?? dto.name ?? dto.userName,
    surname: dto.userInfo?.surname ?? dto.surname ?? '',
    description: dto.userInfo?.description ?? dto.description,
    isSupplier: dto.isSupplier,
  }
}
