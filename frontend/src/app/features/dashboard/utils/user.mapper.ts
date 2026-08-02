import { UserResponse } from '@core/models/user.model';

export interface UserUI {
  id: number;
  fullName: string;
  dni: string;
  email: string;
  roleName: string;
  roleCode?: string;
  isActive: boolean;
  isActiveLabel: string;
  source: UserResponse;
}

export function toUserUI(user: UserResponse): UserUI {
  return {
    id: user.id,
    fullName: `${user.firstName} ${user.lastName}`.trim(),
    dni: user.dni,
    email: user.email,
    roleName: user.roleData?.name ?? '',
    roleCode: user.roleData?.code,
    isActive: user.isActive,
    isActiveLabel: user.isActive ? 'ACTIVO' : 'INACTIVO',
    source: user,
  };
}
