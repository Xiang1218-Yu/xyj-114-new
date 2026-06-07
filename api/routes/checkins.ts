import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';
import { checkinService } from '../services/checkinService.js';

const router = Router();

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { habitId, date, mood, notes } = req.body;
    const result = await checkinService.checkin(req.userId!, habitId, date, mood, notes);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.put('/:id/diary', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const checkinId = parseInt(req.params.id);
    const { mood, notes } = req.body;
    const result = await checkinService.updateDiary(req.userId!, checkinId, mood, notes);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.delete('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { habitId, date } = req.body;
    const result = await checkinService.undoCheckin(req.userId!, habitId, date);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/:date', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await checkinService.getCheckinsByDate(req.userId!, req.params.date);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/history/list', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query as { startDate: string; endDate: string };
    const result = await checkinService.getCheckinHistory(req.userId!, startDate, endDate);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/calendar/:year/:month', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);
    const result = await checkinService.getCheckinCalendar(req.userId!, year, month);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

export default router;
