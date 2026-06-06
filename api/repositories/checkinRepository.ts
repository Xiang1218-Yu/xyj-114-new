import db from '../utils/db';
import type { Checkin, CheckinCalendarDay } from '../../shared/types';

function mapCheckin(row: any): Checkin {
  return {
    id: row.id,
    userId: row.user_id,
    habitId: row.habit_id,
    checkinDate: row.checkin_date,
    createdAt: row.created_at,
  };
}

export const checkinRepository = {
  mapToCheckin(row: any): Checkin {
    return mapCheckin(row);
  },

  create(userId: number, habitId: number, date: string) {
    const stmt = db.prepare(
      'INSERT INTO checkins (user_id, habit_id, checkin_date) VALUES (?, ?, ?)'
    );
    const result = stmt.run(userId, habitId, date);
    return result.lastInsertRowid as number;
  },

  createCheckin(userId: number, habitId: number, checkinDate: string) {
    const stmt = db.prepare(
      'INSERT INTO checkins (user_id, habit_id, checkin_date) VALUES (?, ?, ?)'
    );
    const result = stmt.run(userId, habitId, checkinDate);
    return result.lastInsertRowid as number;
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
};
