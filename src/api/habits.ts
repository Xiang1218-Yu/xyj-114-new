import { createApiClient } from './client';
import type { Habit, CreateHabitRequest } from '@shared/types';

const apiClient = createApiClient('/habits');

export const getHabits = () => apiClient.get<Habit[]>();
export const createHabit = (data: CreateHabitRequest) => apiClient.post<Habit>(data);
export const updateHabit = (id: number, data: Partial<CreateHabitRequest>) =>
  apiClient.put<Habit>(data, `/${id}`);
export const deleteHabit = (id: number) => apiClient.delete<void>(`/${id}`);
