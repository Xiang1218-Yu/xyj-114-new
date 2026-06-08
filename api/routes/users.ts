import { Router } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';
import { asyncAuthHandler } from '../middleware/asyncHandler.js';
import { statsRepository } from '../repositories/statsRepository.js';
import { successResponse } from '../utils/response.js';

const router = Router();

router.get(
  '/stats',
  authMiddleware,
  asyncAuthHandler(async (req: AuthRequest, res) => {
    const userId = req.userId!;
    const stats = statsRepository.getUserStats(userId);
    successResponse(res, stats, '获取用户统计成功');
  })
);

export default router;
