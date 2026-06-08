import { createApiClient } from './client';
import type { LoginRequest, RegisterRequest, AuthResponse, User } from '@shared/types';

const apiClient = createApiClient('/auth');

export const login = (data: LoginRequest) => apiClient.post<AuthResponse>(data, '/login');
export const register = (data: RegisterRequest) => apiClient.post<AuthResponse>(data, '/register');
export const getCurrentUser = () => apiClient.get<User>('/me');
