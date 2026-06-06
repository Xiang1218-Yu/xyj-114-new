import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';
import { statsRepository } from '../repositories/statsRepository.js';
import type { ApiResponse } from '../../shared/types.js';

const router = Router();

router.get('/stats', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const stats = statsRepository.getUserStats(userId);

    res.json({
      success: true,
      data: stats,
    } as ApiResponse<typeof stats>);
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

export default router;
