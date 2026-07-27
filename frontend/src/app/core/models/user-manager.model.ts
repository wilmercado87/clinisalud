export interface UserResponse {
  id: number;
  firstName: string;
  lastName: string;
  dni: string;
  email: string;
  role: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  roleId: number;
  roleData?: RoleResponse;
  documentTypeId: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface RoleResponse {
  id: number;
  name: string;
  code: string;
  permissions?: PermissionOverride[];
}

export interface CreateUserResponse {
  user: UserResponse;
  temporaryPassword: string;
}

export interface PermissionOverride {
  menuOptionId: number;
  hasAccess: boolean;
}

export interface PermissionsRequest {
  permissions: PermissionOverride[];
}

export interface ToggleStatusResponse {
  id: number;
  isActive: boolean;
  message: string;
}
