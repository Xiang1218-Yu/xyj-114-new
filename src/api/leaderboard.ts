import { createApiClient } from './client';
import type { LeaderboardEntry, TeamLeaderboardEntry } from '@shared/types';

const apiClient = createApiClient('/leaderboard');

export const getPersonalLeaderboard = () => apiClient.get<LeaderboardEntry[]>('/personal');
export const getTeamLeaderboard = () => apiClient.get<TeamLeaderboardEntry[]>('/team');
