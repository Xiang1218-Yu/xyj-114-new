import db from '../utils/db';
import type { Habit } from '../../shared/types';

function mapHabit(row: any): Habit {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    frequency: row.frequency,
    targetDays: row.target_days,
    createdAt: row.created_at,
    isCheckedToday: row.is_checked_today ? Boolean(row.is_checked_today) : undefined,
  };
}

export const habitRepository = {
  createHabit(
    userId: number,
    name: string,
    icon: string,
    color: string,
    frequency: string,
    targetDays: number
  ) {
    const stmt = db.prepare(
      'INSERT INTO habits (user_id, name, icon, color, frequency, target_days) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const result = stmt.run(userId, name, icon, color, frequency, targetDays);
    return result.lastInsertRowid as number;
  },

  getHabitsByUserId(userId: number) {
    const stmt = db.prepare('SELECT * FROM habits WHERE user_id = ? ORDER BY created_at DESC');
    const rows = stmt.all(userId);
    return rows.map((row: any) => mapHabit(row));
  },

  getHabitById(id: number, userId: number) {
    const stmt = db.prepare('SELECT * FROM habits WHERE id = ? AND user_id = ?');
    const row = stmt.get(id, userId);
    return row ? mapHabit(row) : null;
  },

  updateHabit(
    id: number,
    userId: number,
    name: string,
    icon: string,
    color: string,
    frequency: string,
    targetDays: number
  ) {
    const stmt = db.prepare(
      'UPDATE habits SET name = ?, icon = ?, color = ?, frequency = ?, target_days = ? WHERE id = ? AND user_id = ?'
    );
    const result = stmt.run(name, icon, color, frequency, targetDays, id, userId);
    return result.changes > 0;
  },

  deleteHabit(id: number, userId: number) {
    const stmt = db.prepare('DELETE FROM habits WHERE id = ? AND user_id = ?');
    const result = stmt.run(id, userId);
    return result.changes > 0;
  },

  getHabitsWithCheckinStatus(userId: number, date: string) {
    const stmt = db.prepare(`
      SELECT h.*,
             CASE WHEN c.id IS NOT NULL THEN 1 ELSE 0 END as is_checked_today
      FROM habits h
      LEFT JOIN checkins c ON h.id = c.habit_id AND c.user_id = h.user_id AND c.checkin_date = ?
      WHERE h.user_id = ?
      ORDER BY h.created_at DESC
    `);
    const rows = stmt.all(date, userId);
    return rows.map((row: any) => mapHabit(row));
  },
};
