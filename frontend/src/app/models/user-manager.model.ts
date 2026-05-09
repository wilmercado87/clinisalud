export interface User {
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
  roleData?: Role;
  createdAt?: Date;
}

export interface Role {
  id: number;
  name: string;
  code: string;
  permissions?: PermissionOverride[];
}

export interface CreateUserResponse {
  user: User;
  temporaryPassword: string;
}

export interface PermissionOverride {
  menuOptionId: number;
  hasAccess: boolean;
}

export interface PermissionPayload {
  permissions: PermissionOverride[];
}

export interface ToggleStatusResponse {
  isActive: boolean;
  message: string;
}
