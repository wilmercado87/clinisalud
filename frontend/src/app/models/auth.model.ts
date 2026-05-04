export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UserSession {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export interface MenuOption {
  id: number;
  label: string;
  icon: string;
  path: string | null;
  order: number;
  parentId: number | null;
  children: MenuOption[];
}

export interface AuthResponse {
  token: string;
  user: UserSession;
  menu: MenuOption[];
}
