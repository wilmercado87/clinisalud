import { UserResponse } from '@core/models/user-manager.model';

export interface LoginRequest {
  email: string;
  password: string;
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
  user: UserResponse;
  menu: MenuOption[];
}
