import { createApiClient, request } from './client';
import type {
  Checkin,
  CheckinWithHabit,
  CheckinCalendarDay,
  CreateCheckinRequest,
  UpdateCheckinDiaryRequest,
} from '@shared/types';

const apiClient = createApiClient('/checkins');

export const checkin = (data: CreateCheckinRequest) => apiClient.post<Checkin>(data);
export const updateCheckinDiary = (checkinId: number, data: UpdateCheckinDiaryRequest) =>
  apiClient.put<Checkin>(data, `/${checkinId}/diary`);
export const undoCheckin = (habitId: number, date: string) =>
  apiClient.delete<void>('', { habitId, date });
export const getCheckinsByDate = (date: string) =>
  apiClient.get<CheckinWithHabit[]>(`/${date}`);
export const getCheckinCalendar = (year: number, month: number) =>
  apiClient.get<CheckinCalendarDay[]>(`/calendar/${year}/${month}`);
export const getCheckinHistory = (startDate: string, endDate: string) =>
  request<Checkin[]>('get', `/checkins/history/list?startDate=${startDate}&endDate=${endDate}`);
