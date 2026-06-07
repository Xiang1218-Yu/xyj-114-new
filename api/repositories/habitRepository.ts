import db from '../utils/db';
import type { Habit } from '../../shared/types';

interface HabitRow {
  id: number;
  user_id: number;
  name: string;
  icon: string;
  color: string;
  frequency: string;
  target_days: number;
  reminder_time?: string;
  reminder_enabled: number;
  short_term_goal?: string;
  long_term_goal?: string;
  category?: string;
  created_at: string;
  is_checked_today?: number;
  current_streak?: number;
  completion_rate?: number;
}

function mapHabit(row: HabitRow): Habit {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    frequency: row.frequency as 'daily' | 'weekly',
    targetDays: row.target_days,
    reminderTime: row.reminder_time || undefined,
    reminderEnabled: Boolean(row.reminder_enabled),
    shortTermGoal: row.short_term_goal || undefined,
    longTermGoal: row.long_term_goal || undefined,
    category: row.category || undefined,
    createdAt: row.created_at,
    isCheckedToday: row.is_checked_today ? Boolean(row.is_checked_today) : undefined,
    currentStreak: row.current_streak !== undefined ? row.current_streak : undefined,
    completionRate: row.completion_rate !== undefined ? row.completion_rate : undefined,
  };
}

export const habitRepository = {
  createHabit(
    userId: number,
    name: string,
    icon: string,
    color: string,
    frequency: string,
    targetDays: number,
    reminderTime?: string,
    reminderEnabled: boolean = false,
    shortTermGoal?: string,
    longTermGoal?: string,
    category?: string
  ) {
    const enabled = Boolean(reminderEnabled);
    const time = enabled ? reminderTime : null;
    const stmt = db.prepare(
      'INSERT INTO habits (user_id, name, icon, color, frequency, target_days, reminder_time, reminder_enabled, short_term_goal, long_term_goal, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const result = stmt.run(
      userId,
      name,
      icon,
      color,
      frequency,
      targetDays,
      time,
      enabled ? 1 : 0,
      shortTermGoal || null,
      longTermGoal || null,
      category || null
    ) as { lastInsertRowid: number | bigint; changes: number };
    return result.lastInsertRowid as number;
  },

  getHabitsByUserId(userId: number) {
    const stmt = db.prepare('SELECT * FROM habits WHERE user_id = ? ORDER BY created_at DESC');
    const rows = stmt.all(userId) as HabitRow[];
    return rows.map((row) => mapHabit(row));
  },

  getHabitById(id: number, userId: number) {
    const stmt = db.prepare('SELECT * FROM habits WHERE id = ? AND user_id = ?');
    const row = stmt.get(id, userId) as HabitRow | undefined;
    return row ? mapHabit(row) : null;
  },

  updateHabit(
    id: number,
    userId: number,
    name: string,
    icon: string,
    color: string,
    frequency: string,
    targetDays: number,
    reminderTime?: string,
    reminderEnabled: boolean = false,
    shortTermGoal?: string,
    longTermGoal?: string,
    category?: string
  ) {
    const enabled = Boolean(reminderEnabled);
    const time = enabled ? reminderTime : null;
    const stmt = db.prepare(
      'UPDATE habits SET name = ?, icon = ?, color = ?, frequency = ?, target_days = ?, reminder_time = ?, reminder_enabled = ?, short_term_goal = ?, long_term_goal = ?, category = ? WHERE id = ? AND user_id = ?'
    );
    const result = stmt.run(
      name,
      icon,
      color,
      frequency,
      targetDays,
      time,
      enabled ? 1 : 0,
      shortTermGoal || null,
      longTermGoal || null,
      category || null,
      id,
      userId
    ) as { changes: number };
    return result.changes > 0;
  },

  deleteHabit(id: number, userId: number) {
    const stmt = db.prepare('DELETE FROM habits WHERE id = ? AND user_id = ?');
    const result = stmt.run(id, userId) as { changes: number };
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
    const rows = stmt.all(date, userId) as HabitRow[];
    return rows.map((row) => mapHabit(row));
  },

  getHabitStats(habitId: number, userId: number) {
    const checkinStmt = db.prepare(`
      SELECT checkin_date
      FROM checkins
      WHERE habit_id = ? AND user_id = ?
      ORDER BY checkin_date DESC
    `);
    const checkins = checkinStmt.all(habitId, userId) as { checkin_date: string }[];

    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < checkins.length; i++) {
      const checkinDate = new Date(checkins[i].checkin_date);
      checkinDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      expectedDate.setHours(0, 0, 0, 0);

      if (checkinDate.getTime() === expectedDate.getTime()) {
        currentStreak++;
      } else if (i === 0 && checkinDate.getTime() < expectedDate.getTime()) {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        if (checkinDate.getTime() === yesterday.getTime()) {
          currentStreak++;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    const habit = this.getHabitById(habitId, userId);
    if (!habit) {
      return { currentStreak: 0, completionRate: 0 };
    }

    const createdDate = new Date(habit.createdAt);
    createdDate.setHours(0, 0, 0, 0);
    const daysSinceCreation = Math.max(
      1,
      Math.ceil((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
    );
    const completionRate = Math.round((checkins.length / daysSinceCreation) * 100);

    return { currentStreak, completionRate };
  },

  getHabitsWithStats(userId: number, date: string) {
    const habits = this.getHabitsWithCheckinStatus(userId, date);
    return habits.map((habit) => {
      const stats = this.getHabitStats(habit.id, userId);
      return {
        ...habit,
        currentStreak: stats.currentStreak,
        completionRate: stats.completionRate,
      };
    });
  },
};
