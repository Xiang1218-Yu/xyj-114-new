import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';
import db from '../utils/db.js';

const router = Router();

router.get('/stats', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const statsRow = db.prepare(`
      SELECT 
        u.total_checkins as totalCheckins,
        u.streak_days as streakDays,
        COUNT(DISTINCT h.id) as habitsCount,
        SUM(CASE WHEN c.checkin_date >= date('now', '-7 days') THEN 1 ELSE 0 END) as checkinsThisWeek,
        SUM(CASE WHEN c.checkin_date >= date('now', 'start of month') THEN 1 ELSE 0 END) as checkinsThisMonth
      FROM users u
      LEFT JOIN habits h ON h.user_id = u.id
      LEFT JOIN checkins c ON c.user_id = u.id
      WHERE u.id = ?
      GROUP BY u.id
    `).get(userId) as {
      totalCheckins: number;
      streakDays: number;
      habitsCount: number;
      checkinsThisWeek: number;
      checkinsThisMonth: number;
    };

    const habitStats = db.prepare(`
      SELECT 
        h.id as habitId,
        h.name as habitName,
        h.icon,
        h.color,
        COUNT(c.id) as count,
        ROUND(
          (COUNT(DISTINCT c.checkin_date) * 100.0) / 
          MAX(1, (julianday('now') - julianday(h.created_at)) + 1),
          1
        ) as completionRate
      FROM habits h
      LEFT JOIN checkins c ON c.habit_id = h.id
      WHERE h.user_id = ?
      GROUP BY h.id
      ORDER BY count DESC
    `).all(userId) as {
      habitId: number;
      habitName: string;
      icon: string;
      color: string;
      count: number;
      completionRate: number;
    }[];

    res.json({
      success: true,
      data: {
        ...statsRow,
        habitStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

export default router;
