import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';
import { habitService } from '../services/habitService.js';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await habitService.getHabits(req.userId!);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    console.log('Creating habit with data:', JSON.stringify(req.body));
    const result = await habitService.createHabit(req.userId!, req.body);
    console.log('Create habit result:', JSON.stringify(result));
    res.json(result);
  } catch (error) {
    console.error('Error creating habit:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const habitId = parseInt(req.params.id);
    const result = await habitService.updateHabit(req.userId!, habitId, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const habitId = parseInt(req.params.id);
    const result = await habitService.deleteHabit(req.userId!, habitId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

export default router;
