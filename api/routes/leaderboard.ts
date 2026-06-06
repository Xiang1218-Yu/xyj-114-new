import { Router, Response } from 'express';
import { leaderboardService } from '../services/leaderboardService.js';

const router = Router();

router.get('/personal', async (_req, res: Response) => {
  try {
    const result = await leaderboardService.getPersonalLeaderboard();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/team', async (_req, res: Response) => {
  try {
    const result = await leaderboardService.getTeamLeaderboard();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

export default router;
