export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UserSession {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  dni: string;
  phone?: string;
  address?: string;
  role: string;
  roleId: number;
  isActive: boolean;
  documentTypeId: number;
  roleData?: { id: number; name: string; code: string };
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

export interface AuthResponse {
  token: string;
  user: UserSession;
  menu: MenuOption[];
}
