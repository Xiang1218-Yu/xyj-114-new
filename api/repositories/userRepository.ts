import db from '../utils/db';
import type { User, LeaderboardEntry } from '../../shared/types';

function mapUser(row: any): User {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    avatar: row.avatar,
    totalCheckins: row.total_checkins,
    streakDays: row.streak_days,
    createdAt: row.created_at,
  };
}

function mapLeaderboardEntry(row: any, index: number): LeaderboardEntry {
  return {
    rank: index + 1,
    userId: row.user_id,
    username: row.username,
    avatar: row.avatar,
    checkinCount: row.checkin_count,
  };
}

export const userRepository = {
  createUser(username: string, email: string, passwordHash: string) {
    const stmt = db.prepare(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
    );
    const result = stmt.run(username, email, passwordHash);
    return result.lastInsertRowid as number;
  },

  findByUsername(username: string): User | null {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    const row = stmt.get(username);
    return row ? mapUser(row) : null;
  },

  findByEmail(email: string): User | null {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const row = stmt.get(email);
    return row ? mapUser(row) : null;
  },

  findById(id: number): User | null {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const row = stmt.get(id);
    return row ? mapUser(row) : null;
  },

  getPasswordHashById(id: number): string | null {
    const stmt = db.prepare('SELECT password_hash FROM users WHERE id = ?');
    const row = stmt.get(id) as { password_hash: string } | undefined;
    return row?.password_hash || null;
  },

  updateCheckinStats(
    userId: number,
    totalCheckins: number,
    streakDays: number,
    lastCheckinDate: string
  ) {
    const stmt = db.prepare(
      'UPDATE users SET total_checkins = ?, streak_days = ?, last_checkin_date = ? WHERE id = ?'
    );
    const result = stmt.run(totalCheckins, streakDays, lastCheckinDate, userId);
    return result.changes > 0;
  },

  getPersonalLeaderboard(limit: number = 100): LeaderboardEntry[] {
    const stmt = db.prepare(`
      SELECT u.id as user_id, u.username, u.avatar, u.total_checkins as checkin_count
      FROM users u
      ORDER BY u.total_checkins DESC
      LIMIT ?
    `);
    const rows = stmt.all(limit);
    return rows.map((row: any, index: number) => mapLeaderboardEntry(row, index));
  },
};
