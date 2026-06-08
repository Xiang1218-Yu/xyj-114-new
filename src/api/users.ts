import { createApiClient } from './client';
import type { UserStats } from '@shared/types';

const apiClient = createApiClient('/users');

export const getUserStats = () => apiClient.get<UserStats>('/stats');
