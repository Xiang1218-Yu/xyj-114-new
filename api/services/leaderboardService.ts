import type { ApiResponse, LeaderboardEntry, TeamLeaderboardEntry } from '../../shared/types';
import { leaderboardRepository } from '../repositories/leaderboardRepository';

export const leaderboardService = {
  getPersonalLeaderboard(): ApiResponse<LeaderboardEntry[]> {
    const leaderboard = leaderboardRepository.getPersonalLeaderboard(100);

    return {
      success: true,
      data: leaderboard,
    };
  },

  getTeamLeaderboard(): ApiResponse<TeamLeaderboardEntry[]> {
    const leaderboard = leaderboardRepository.getTeamLeaderboard(100);

    return {
      success: true,
      data: leaderboard,
    };
  },
};
