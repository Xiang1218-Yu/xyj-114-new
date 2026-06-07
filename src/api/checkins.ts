import { request } from './client';
import type {
  Checkin,
  CheckinWithHabit,
  CheckinCalendarDay,
  ApiResponse,
} from '@shared/types';

export const checkin = (habitId: number, date: string): Promise<ApiResponse<Checkin>> => {
  return request<Checkin>('post', '/checkins', { habitId, date });
};

export const undoCheckin = (habitId: number, date: string): Promise<ApiResponse<void>> => {
  return request<void>('delete', '/checkins', { habitId, date });
};

export const getCheckinsByDate = (date: string): Promise<ApiResponse<CheckinWithHabit[]>> => {
  return request<CheckinWithHabit[]>('get', `/checkins/${date}`);
};

export const getCheckinCalendar = (
  year: number,
  month: number
): Promise<ApiResponse<CheckinCalendarDay[]>> => {
  return request<CheckinCalendarDay[]>('get', `/checkins/calendar/${year}/${month}`);
};

export const getCheckinHistory = (
  startDate: string,
  endDate: string
): Promise<ApiResponse<Checkin[]>> => {
  return request<Checkin[]>('get', `/checkins/history/list?startDate=${startDate}&endDate=${endDate}`);
};
