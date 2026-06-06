import { request } from './client';
import type {
  Habit,
  CreateHabitRequest,
  ApiResponse,
} from '@shared/types';

export const getHabits = (): Promise<ApiResponse<Habit[]>> => {
  return request<Habit[]>('get', '/habits');
};

export const createHabit = (data: CreateHabitRequest): Promise<ApiResponse<Habit>> => {
  return request<Habit>('post', '/habits', data);
};

export const updateHabit = (
  id: number,
  data: Partial<CreateHabitRequest>
): Promise<ApiResponse<Habit>> => {
  return request<Habit>('put', `/habits/${id}`, data);
};

export const deleteHabit = (id: number): Promise<ApiResponse<void>> => {
  return request<void>('delete', `/habits/${id}`);
};
