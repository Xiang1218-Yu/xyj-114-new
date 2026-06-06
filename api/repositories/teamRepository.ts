import db from '../utils/db';
import type { Team, TeamMember, TeamLeaderboardEntry } from '../../shared/types';

function mapTeam(row: any): Team {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    inviteCode: row.invite_code,
    ownerId: row.owner_id,
    createdAt: row.created_at,
    memberCount: row.member_count || 0,
    totalCheckins: row.total_checkins || 0,
  };
}

function mapTeamMember(row: any): TeamMember {
  return {
    id: row.id,
    teamId: row.team_id,
    userId: row.user_id,
    joinedAt: row.joined_at,
    user: {
      id: row.user_id,
      username: row.username,
      email: row.email,
      avatar: row.avatar,
      totalCheckins: row.total_checkins,
      streakDays: row.streak_days,
      createdAt: row.user_created_at,
    },
  };
}

function mapTeamLeaderboardEntry(row: any, index: number): TeamLeaderboardEntry {
  return {
    rank: index + 1,
    teamId: row.team_id,
    name: row.name,
    memberCount: row.member_count,
    totalCheckins: row.total_checkins,
  };
}

export const teamRepository = {
  createTeam(name: string, description: string, inviteCode: string, ownerId: number) {
    const stmt = db.prepare(
      'INSERT INTO teams (name, description, invite_code, owner_id) VALUES (?, ?, ?, ?)'
    );
    const result = stmt.run(name, description, inviteCode, ownerId);
    return result.lastInsertRowid as number;
  },

  getTeamsByUserId(userId: number): Team[] {
    const stmt = db.prepare(`
      SELECT t.*,
             (SELECT COUNT(*) FROM team_members tm WHERE tm.team_id = t.id) as member_count,
             (SELECT COUNT(*) FROM checkins c
              JOIN team_members tm ON c.user_id = tm.user_id
              WHERE tm.team_id = t.id) as total_checkins
      FROM teams t
      INNER JOIN team_members tm ON t.id = tm.team_id
      WHERE tm.user_id = ?
      ORDER BY t.created_at DESC
    `);
    const rows = stmt.all(userId);
    return rows.map((row: any) => mapTeam(row));
  },

  getTeamById(id: number): Team | null {
    const stmt = db.prepare(`
      SELECT t.*,
             (SELECT COUNT(*) FROM team_members tm WHERE tm.team_id = t.id) as member_count,
             (SELECT COUNT(*) FROM checkins c
              JOIN team_members tm ON c.user_id = tm.user_id
              WHERE tm.team_id = t.id) as total_checkins
      FROM teams t
      WHERE t.id = ?
    `);
    const row = stmt.get(id);
    return row ? mapTeam(row) : null;
  },

  findByInviteCode(inviteCode: string): Team | null {
    const stmt = db.prepare(`
      SELECT t.*,
             (SELECT COUNT(*) FROM team_members tm WHERE tm.team_id = t.id) as member_count,
             (SELECT COUNT(*) FROM checkins c
              JOIN team_members tm ON c.user_id = tm.user_id
              WHERE tm.team_id = t.id) as total_checkins
      FROM teams t
      WHERE t.invite_code = ?
    `);
    const row = stmt.get(inviteCode);
    return row ? mapTeam(row) : null;
  },

  addTeamMember(teamId: number, userId: number) {
    const stmt = db.prepare(
      'INSERT INTO team_members (team_id, user_id) VALUES (?, ?)'
    );
    const result = stmt.run(teamId, userId);
    return result.lastInsertRowid as number;
  },

  getTeamMembers(teamId: number): TeamMember[] {
    const stmt = db.prepare(`
      SELECT tm.id, tm.team_id, tm.user_id, tm.joined_at,
             u.username, u.email, u.avatar, u.total_checkins, u.streak_days,
             u.created_at as user_created_at
      FROM team_members tm
      INNER JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = ?
      ORDER BY tm.joined_at
    `);
    const rows = stmt.all(teamId);
    return rows.map((row: any) => mapTeamMember(row));
  },

  getTeamLeaderboard(limit: number = 100): TeamLeaderboardEntry[] {
    const stmt = db.prepare(`
      SELECT t.id as team_id, t.name,
             (SELECT COUNT(*) FROM team_members tm WHERE tm.team_id = t.id) as member_count,
             (SELECT COUNT(*) FROM checkins c
              JOIN team_members tm ON c.user_id = tm.user_id
              WHERE tm.team_id = t.id) as total_checkins
      FROM teams t
      ORDER BY total_checkins DESC
      LIMIT ?
    `);
    const rows = stmt.all(limit);
    return rows.map((row: any, index: number) => mapTeamLeaderboardEntry(row, index));
  },

  isTeamMember(teamId: number, userId: number) {
    const stmt = db.prepare(`
      SELECT 1 FROM team_members
      WHERE team_id = ? AND user_id = ?
      LIMIT 1
    `);
    const row = stmt.get(teamId, userId);
    return !!row;
  },
};
