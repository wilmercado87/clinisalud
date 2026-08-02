export interface PermissionOverride {
  menuOptionId: number;
  hasAccess: boolean;
}

export interface CreateUserRequest {
  email: string;
  dni: string;
  documentTypeId: number;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  roleId: number;
  permissions: number[];
}

export interface UserResponse {
  id: number;
  firstName: string;
  lastName: string;
  documentTypeId: number;
  dni: string;
  email: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  roleId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserResult {
  user: UserResponse;
  emailSent: boolean;
}

export interface ManageableUserResponse extends UserResponse {
  role?: string;
  roleData?: {
    id: number;
    name: string;
    code: string;
    permissions: PermissionOverride[];
  };
}

export interface MenuOptionResponse {
  id: number;
  label: string;
  icon: string;
  path: string | null;
  order: number;
  parentId: number | null;
  isActive: boolean;
  children: MenuOptionResponse[];
}

export interface ToggleStatusResponse {
  id: number;
  isActive: boolean;
  message: string;
}
