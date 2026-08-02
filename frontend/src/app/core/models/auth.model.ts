import { MenuOption, UserResponse } from '@core/models/user.model';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: UserResponse;
  menu: MenuOption[];
}
