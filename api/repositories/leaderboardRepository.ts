import db from '../utils/db';
import type { LeaderboardEntry, TeamLeaderboardEntry } from '../../shared/types';

export const leaderboardRepository = {
  getPersonalLeaderboard(limit = 100): LeaderboardEntry[] {
    return db.prepare(
      `SELECT 
        ROW_NUMBER() OVER (ORDER BY u.total_checkins DESC, u.streak_days DESC) as rank,
        u.id as userId,
        u.username,
        u.avatar,
        u.total_checkins as checkinCount
       FROM users u
       WHERE u.total_checkins > 0
       ORDER BY u.total_checkins DESC, u.streak_days DESC
       LIMIT ?`
    ).all(limit) as LeaderboardEntry[];
  },

  getTeamLeaderboard(limit = 100): TeamLeaderboardEntry[] {
    return db.prepare(
      `SELECT 
        ROW_NUMBER() OVER (ORDER BY 
          COALESCE((SELECT COUNT(*) FROM checkins c 
                    JOIN team_members tm ON c.user_id = tm.user_id 
                    WHERE tm.team_id = t.id), 0) DESC, 
          (SELECT COUNT(*) FROM team_members tm WHERE tm.team_id = t.id) DESC) as rank,
        t.id as teamId,
        t.name,
        (SELECT COUNT(*) FROM team_members tm WHERE tm.team_id = t.id) as memberCount,
        COALESCE((SELECT COUNT(*) FROM checkins c 
                  JOIN team_members tm ON c.user_id = tm.user_id 
                  WHERE tm.team_id = t.id), 0) as totalCheckins
       FROM teams t
       ORDER BY 
         COALESCE((SELECT COUNT(*) FROM checkins c 
                   JOIN team_members tm ON c.user_id = tm.user_id 
                   WHERE tm.team_id = t.id), 0) DESC, 
         (SELECT COUNT(*) FROM team_members tm WHERE tm.team_id = t.id) DESC
       LIMIT ?`
    ).all(limit) as TeamLeaderboardEntry[];
  },
};
