import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { leaderboardService } from '../services/leaderboardService.js';
import { successResponse } from '../utils/response.js';

const router = Router();

router.get(
  '/personal',
  asyncHandler(async (_req, res) => {
    const result = await leaderboardService.getPersonalLeaderboard();
    successResponse(res, result, '获取个人排行榜成功');
  })
);

router.get(
  '/team',
  asyncHandler(async (_req, res) => {
    const result = await leaderboardService.getTeamLeaderboard();
    successResponse(res, result, '获取团队排行榜成功');
  })
);

export default router;
