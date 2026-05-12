export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AuthRequest extends Request {
  user?: {
    id: number;
    role: string;
    email: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ErrorResponse {
  message: string;
  code?: string;
  details?: any;
}