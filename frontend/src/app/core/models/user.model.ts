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

export interface PermissionOverride {
  menuOptionId: number;
  hasAccess: boolean;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  dni: string;
  email: string;
  phone?: string;
  address?: string;
  roleId: number;
  permissions: number[];
  documentTypeId?: number;
}

export interface CreateUserResponse {
  user: UserResponse;
  emailSent: boolean;
}

export interface PermissionsRequest {
  permissions: PermissionOverride[];
}

export interface ToggleStatusResponse {
  id: number;
  isActive: boolean;
  message: string;
}

export interface MenuOption {
  id: number;
  label: string;
  icon: string;
  path: string | null;
  order: number;
  parentId: number | null;
  isActive: boolean;
  children: MenuOption[];
}
