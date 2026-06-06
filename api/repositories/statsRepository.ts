import db from '../utils/db';
import type { UserStats } from '../../shared/types';
import { checkinRepository } from './checkinRepository';

const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getWeekStartDate = (): string => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dayOfWeek);
  return getLocalDateString(weekStart);
};

const getMonthString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

interface HabitStat {
  habitId: number;
  habitName: string;
  icon: string;
  color: string;
  count: number;
  completionRate: number;
}

export const statsRepository = {
  getUserStats(userId: number): UserStats {
    const userStmt = db.prepare(`
      SELECT total_checkins, streak_days,
             (SELECT COUNT(*) FROM habits WHERE user_id = ?) as habits_count
      FROM users WHERE id = ?
    `);
    const userRow = userStmt.get(userId, userId) as {
      total_checkins: number;
      streak_days: number;
      habits_count: number;
    } | undefined;

    const weekStartDate = getWeekStartDate();
    const weekStmt = db.prepare(`
      SELECT COUNT(*) as count FROM checkins
      WHERE user_id = ? AND checkin_date >= ?
    `);
    const weekRow = weekStmt.get(userId, weekStartDate) as { count: number } | undefined;

    const monthStr = getMonthString();
    const monthStmt = db.prepare(`
      SELECT COUNT(*) as count FROM checkins
      WHERE user_id = ? AND strftime('%Y-%m', checkin_date) = ?
    `);
    const monthRow = monthStmt.get(userId, monthStr) as { count: number } | undefined;

    const habitStatsStmt = db.prepare(`
      SELECT h.id as habit_id, h.name as habit_name, h.icon, h.color, h.frequency, h.target_days,
             COUNT(c.id) as count
      FROM habits h
      LEFT JOIN checkins c ON h.id = c.habit_id AND c.user_id = h.user_id
      WHERE h.user_id = ?
      GROUP BY h.id
      ORDER BY h.created_at DESC
    `);
    const habitRows = habitStatsStmt.all(userId) as Array<{
      habit_id: number;
      habit_name: string;
      icon: string;
      color: string;
      frequency: string;
      target_days: number;
      count: number;
    }>;

    const habitStats: HabitStat[] = habitRows.map((row) => {
      const targetDays = row.target_days || 7;
      const completionRate = targetDays > 0 ? Math.min(100, Math.round((row.count / targetDays) * 100)) : 0;
      return {
        habitId: row.habit_id,
        habitName: row.habit_name,
        icon: row.icon,
        color: row.color,
        count: row.count,
        completionRate,
      };
    });

    return {
      totalCheckins: checkinRepository.getTotalCheckins(userId),
      streakDays: checkinRepository.getStreakDays(userId),
      habitsCount: userRow?.habits_count || 0,
      checkinsThisWeek: weekRow?.count || 0,
      checkinsThisMonth: monthRow?.count || 0,
      habitStats,
    };
  },

  getHabitStats(userId: number): HabitStat[] {
    const stmt = db.prepare(`
      SELECT h.id as habit_id, h.name as habit_name, h.icon, h.color, h.frequency, h.target_days,
             COUNT(c.id) as count
      FROM habits h
      LEFT JOIN checkins c ON h.id = c.habit_id AND c.user_id = h.user_id
      WHERE h.user_id = ?
      GROUP BY h.id
      ORDER BY h.created_at DESC
    `);
    const rows = stmt.all(userId) as Array<{
      habit_id: number;
      habit_name: string;
      icon: string;
      color: string;
      frequency: string;
      target_days: number;
      count: number;
    }>;

    return rows.map((row) => {
      const targetDays = row.target_days || 7;
      const completionRate = targetDays > 0 ? Math.min(100, Math.round((row.count / targetDays) * 100)) : 0;
      return {
        habitId: row.habit_id,
        habitName: row.habit_name,
        icon: row.icon,
        color: row.color,
        count: row.count,
        completionRate,
      };
    });
  },
};
