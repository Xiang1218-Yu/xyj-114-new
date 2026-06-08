import db from '../utils/db';
import type { Checkin, CheckinCalendarDay, CheckinWithHabit } from '../../shared/types';

function mapCheckin(row: any): Checkin {
  return {
    id: row.id,
    userId: row.user_id,
    habitId: row.habit_id,
    checkinDate: row.checkin_date,
    mood: row.mood,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

function mapCheckinWithHabit(row: any): CheckinWithHabit {
  return {
    id: row.id,
    userId: row.user_id,
    habitId: row.habit_id,
    checkinDate: row.checkin_date,
    mood: row.mood,
    notes: row.notes,
    createdAt: row.created_at,
    habitName: row.habit_name,
    habitIcon: row.habit_icon,
    habitColor: row.habit_color,
  };
}

export const checkinRepository = {
  mapToCheckin(row: any): Checkin {
    return mapCheckin(row);
  },

  create(userId: number, habitId: number, date: string, mood?: string, notes?: string) {
    const stmt = db.prepare(
      'INSERT INTO checkins (user_id, habit_id, checkin_date, mood, notes) VALUES (?, ?, ?, ?, ?)'
    );
    const result = stmt.run(userId, habitId, date, mood || null, notes || null);
    return result.lastInsertRowid as number;
  },

  createCheckin(userId: number, habitId: number, checkinDate: string, mood?: string, notes?: string) {
    const stmt = db.prepare(
      'INSERT INTO checkins (user_id, habit_id, checkin_date, mood, notes) VALUES (?, ?, ?, ?, ?)'
    );
    const result = stmt.run(userId, habitId, checkinDate, mood || null, notes || null);
    return result.lastInsertRowid as number;
  },

  updateCheckinDiary(checkinId: number, userId: number, mood?: string, notes?: string) {
    const updates: string[] = [];
    const params: (string | number | null)[] = [];

    if (mood !== undefined) {
      updates.push('mood = ?');
      params.push(mood || null);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes || null);
    }

    if (updates.length === 0) {
      return false;
    }

    params.push(checkinId, userId);
    const stmt = db.prepare(
      `UPDATE checkins SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`
    );
    const result = stmt.run(...params);
    return result.changes > 0;
  },

  findByUserAndDate(userId: number, date: string) {
    const stmt = db.prepare(`
      SELECT * FROM checkins
      WHERE user_id = ? AND checkin_date = ?
      ORDER BY created_at DESC
    `);
    return stmt.all(userId, date);
  },

  getCheckinsByDate(userId: number, date: string): Checkin[] {
    const stmt = db.prepare(`
      SELECT * FROM checkins
      WHERE user_id = ? AND checkin_date = ?
      ORDER BY created_at DESC
    `);
    const rows = stmt.all(userId, date);
    return rows.map((row: any) => mapCheckin(row));
  },

  getCheckinsByDateWithHabit(userId: number, date: string): CheckinWithHabit[] {
    const stmt = db.prepare(`
      SELECT c.*, h.name as habit_name, h.icon as habit_icon, h.color as habit_color
      FROM checkins c
      JOIN habits h ON c.habit_id = h.id
      WHERE c.user_id = ? AND c.checkin_date = ?
      ORDER BY c.created_at DESC
    `);
    const rows = stmt.all(userId, date);
    return rows.map((row: any) => mapCheckinWithHabit(row));
  },

  findByUserAndDateRange(userId: number, startDate: string, endDate: string) {
    const stmt = db.prepare(`
      SELECT * FROM checkins
      WHERE user_id = ? AND checkin_date BETWEEN ? AND ?
      ORDER BY checkin_date DESC, created_at DESC
    `);
    return stmt.all(userId, startDate, endDate);
  },

  getCheckinHistory(userId: number, startDate: string, endDate: string): Checkin[] {
    const stmt = db.prepare(`
      SELECT * FROM checkins
      WHERE user_id = ? AND checkin_date BETWEEN ? AND ?
      ORDER BY checkin_date DESC, created_at DESC
    `);
    const rows = stmt.all(userId, startDate, endDate);
    return rows.map((row: any) => mapCheckin(row));
  },

  findByUserHabitAndDate(userId: number, habitId: number, date: string) {
    const stmt = db.prepare(`
      SELECT * FROM checkins
      WHERE user_id = ? AND habit_id = ? AND checkin_date = ?
      LIMIT 1
    `);
    return stmt.get(userId, habitId, date);
  },

  hasCheckinOnDate(userId: number, habitId: number, date: string) {
    const stmt = db.prepare(`
      SELECT 1 FROM checkins
      WHERE user_id = ? AND habit_id = ? AND checkin_date = ?
      LIMIT 1
    `);
    const row = stmt.get(userId, habitId, date);
    return !!row;
  },

  hasCheckedIn(userId: number, habitId: number, date: string): boolean {
    const stmt = db.prepare(`
      SELECT 1 FROM checkins
      WHERE user_id = ? AND habit_id = ? AND checkin_date = ?
      LIMIT 1
    `);
    const row = stmt.get(userId, habitId, date);
    return !!row;
  },

  getCalendarData(userId: number, year: number, month: number) {
    const stmt = db.prepare(`
      SELECT checkin_date as date, COUNT(*) as count
      FROM checkins
      WHERE user_id = ? AND strftime('%Y', checkin_date) = ? AND strftime('%m', checkin_date) = ?
      GROUP BY checkin_date
      ORDER BY checkin_date
    `);
    const yearStr = year.toString();
    const monthStr = month.toString().padStart(2, '0');
    return stmt.all(userId, yearStr, monthStr);
  },

  getCheckinCalendar(userId: number, year: number, month: number): CheckinCalendarDay[] {
    const stmt = db.prepare(`
      SELECT checkin_date as date, COUNT(*) as count
      FROM checkins
      WHERE user_id = ? AND strftime('%Y', checkin_date) = ? AND strftime('%m', checkin_date) = ?
      GROUP BY checkin_date
      ORDER BY checkin_date
    `);
    const yearStr = year.toString();
    const monthStr = month.toString().padStart(2, '0');
    const rows = stmt.all(userId, yearStr, monthStr);
    return rows.map((row: any): CheckinCalendarDay => ({
      date: row.date,
      count: row.count,
    }));
  },

  getTotalCheckinsByUser(userId: number): number {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count FROM checkins WHERE user_id = ?
    `);
    const row = stmt.get(userId) as { count: number };
    return row?.count || 0;
  },

  getLastCheckinDate(userId: number): string | null {
    const stmt = db.prepare(`
      SELECT MAX(checkin_date) as last_date FROM checkins WHERE user_id = ?
    `);
    const row = stmt.get(userId) as { last_date: string | null };
    return row?.last_date || null;
  },

  delete(userId: number, habitId: number, date: string) {
    const stmt = db.prepare(`
      DELETE FROM checkins
      WHERE user_id = ? AND habit_id = ? AND checkin_date = ?
    `);
    const result = stmt.run(userId, habitId, date);
    return result.changes > 0;
  },

  deleteCheckin(userId: number, habitId: number, checkinDate: string): boolean {
    const stmt = db.prepare(`
      DELETE FROM checkins
      WHERE user_id = ? AND habit_id = ? AND checkin_date = ?
    `);
    const result = stmt.run(userId, habitId, checkinDate);
    return result.changes > 0;
  },

  getStreakDays(userId: number): number {
    const now = new Date();
    let streak = 0;
    let currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const stmt = db.prepare(`
      SELECT COUNT(*) as count FROM checkins
      WHERE user_id = ? AND checkin_date = ?
    `);

    while (true) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      const row = stmt.get(userId, dateStr) as { count: number };
      
      if (row.count > 0) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  },

  getTotalCheckins(userId: number): number {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count FROM checkins
      WHERE user_id = ?
    `);
    const row = stmt.get(userId) as { count: number };
    return row.count || 0;
  },
};
