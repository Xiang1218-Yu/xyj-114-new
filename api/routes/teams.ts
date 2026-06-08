import { Router } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';
import { asyncAuthHandler } from '../middleware/asyncHandler.js';
import { teamService } from '../services/teamService.js';
import { successResponse } from '../utils/response.js';
import { validate, validateParams, schemas } from '../utils/validation.js';
import type { CreateTeamRequest, JoinTeamRequest } from '../../shared/types.js';

const router = Router();

router.get(
  '/',
  authMiddleware,
  asyncAuthHandler(async (req: AuthRequest, res) => {
    const result = await teamService.getTeams(req.userId!);
    successResponse(res, result, '获取团队列表成功');
  })
);

router.post(
  '/',
  authMiddleware,
  asyncAuthHandler(async (req: AuthRequest, res) => {
    const { name, description } = validate<CreateTeamRequest>(req.body, schemas.createTeam);
    const result = await teamService.createTeam(req.userId!, name, description);
    successResponse(res, result, '创建团队成功', 201);
  })
);

router.post(
  '/join',
  authMiddleware,
  asyncAuthHandler(async (req: AuthRequest, res) => {
    const { inviteCode } = validate<JoinTeamRequest>(req.body, schemas.joinTeam);
    const result = await teamService.joinTeam(req.userId!, inviteCode);
    successResponse(res, result, '加入团队成功');
  })
);

router.get(
  '/:id',
  authMiddleware,
  asyncAuthHandler(async (req: AuthRequest, res) => {
    const [teamId] = validateParams(req.params, ['id']);
    const result = await teamService.getTeamDetail(teamId, req.userId!);
    successResponse(res, result, '获取团队详情成功');
  })
);

router.get(
  '/:id/members',
  authMiddleware,
  asyncAuthHandler(async (req: AuthRequest, res) => {
    const [teamId] = validateParams(req.params, ['id']);
    const result = await teamService.getTeamMembers(teamId, req.userId!);
    successResponse(res, result, '获取团队成员成功');
  })
);

export default router;
