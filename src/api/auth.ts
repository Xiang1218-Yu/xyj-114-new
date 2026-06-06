import { request } from './client';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
  ApiResponse,
} from '@shared/types';

export const login = (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
  return request<AuthResponse>('post', '/auth/login', data);
};

export const register = (data: RegisterRequest): Promise<ApiResponse<AuthResponse>> => {
  return request<AuthResponse>('post', '/auth/register', data);
};

export const getCurrentUser = (): Promise<ApiResponse<User>> => {
  return request<User>('get', '/auth/me');
};
