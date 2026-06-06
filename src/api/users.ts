import { request } from './client';
import type { UserStats, ApiResponse } from '@shared/types';

export const getUserStats = (): Promise<ApiResponse<UserStats>> => {
  return request<UserStats>('get', '/users/stats');
};
