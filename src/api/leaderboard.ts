import { request } from './client';
import type {
  LeaderboardEntry,
  TeamLeaderboardEntry,
  ApiResponse,
} from '@shared/types';

export const getPersonalLeaderboard = (): Promise<ApiResponse<LeaderboardEntry[]>> => {
  return request<LeaderboardEntry[]>('get', '/leaderboard/personal');
};

export const getTeamLeaderboard = (): Promise<ApiResponse<TeamLeaderboardEntry[]>> => {
  return request<TeamLeaderboardEntry[]>('get', '/leaderboard/team');
};
