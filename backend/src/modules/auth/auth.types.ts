import { UserResponse } from "../users/users.types";
import { MenuOptionResponse } from "../users/users.types";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: UserResponse & { role?: string; roleData?: { id: number; name: string; code: string } | null };
  menu: MenuOptionResponse[];
  token: string;
}

export interface UpdateProfileRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
