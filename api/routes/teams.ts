import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';
import { teamService } from '../services/teamService.js';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await teamService.getTeams(req.userId!);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;
    const result = await teamService.createTeam(req.userId!, name, description);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/join', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { inviteCode } = req.body;
    const result = await teamService.joinTeam(req.userId!, inviteCode);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const teamId = parseInt(req.params.id);
    const result = await teamService.getTeamDetail(teamId, req.userId!);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/:id/members', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const teamId = parseInt(req.params.id);
    const result = await teamService.getTeamMembers(teamId, req.userId!);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

export default router;
