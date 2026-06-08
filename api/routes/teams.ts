import { Router } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';
import { asyncAuthHandler } from '../middleware/asyncHandler.js';
import { teamService } from '../services/teamService.js';
import { successResponse } from '../utils/response.js';
import { validate, validateParams, schemas } from '../utils/validation.js';
import { NotFoundError, BadRequestError, ConflictError, ForbiddenError } from '../utils/errors.js';
import type { CreateTeamRequest, JoinTeamRequest } from '../../shared/types.js';

const router = Router();

router.get(
  '/',
  authMiddleware,
  asyncAuthHandler(async (req: AuthRequest, res) => {
    const result = await teamService.getTeams(req.userId!);
    if (!result.success) {
      throw new BadRequestError(result.message);
    }
    successResponse(res, result.data, '获取团队列表成功');
  })
);

router.post(
  '/',
  authMiddleware,
  asyncAuthHandler(async (req: AuthRequest, res) => {
    const { name, description } = validate<CreateTeamRequest>(req.body, schemas.createTeam);
    const result = await teamService.createTeam(req.userId!, name, description);
    if (!result.success) {
      if (result.message === '用户不存在') {
        throw new NotFoundError(result.message);
      }
      throw new BadRequestError(result.message);
    }
    successResponse(res, result.data, '创建团队成功', 201);
  })
);

router.post(
  '/join',
  authMiddleware,
  asyncAuthHandler(async (req: AuthRequest, res) => {
    const { inviteCode } = validate<JoinTeamRequest>(req.body, schemas.joinTeam);
    const result = await teamService.joinTeam(req.userId!, inviteCode);
    if (!result.success) {
      if (result.message === '邀请码无效') {
        throw new NotFoundError(result.message);
      }
      if (result.message === '您已加入此队伍') {
        throw new ConflictError(result.message);
      }
      throw new BadRequestError(result.message);
    }
    successResponse(res, result.data, '加入团队成功');
  })
);

router.get(
  '/:id',
  authMiddleware,
  asyncAuthHandler(async (req: AuthRequest, res) => {
    const [teamId] = validateParams(req.params, ['id']);
    const result = await teamService.getTeamDetail(teamId, req.userId!);
    if (!result.success) {
      if (result.message === '队伍不存在') {
        throw new NotFoundError(result.message);
      }
      if (result.message === '无权限查看此队伍') {
        throw new ForbiddenError(result.message);
      }
      throw new BadRequestError(result.message);
    }
    successResponse(res, result.data, '获取团队详情成功');
  })
);

router.get(
  '/:id/members',
  authMiddleware,
  asyncAuthHandler(async (req: AuthRequest, res) => {
    const [teamId] = validateParams(req.params, ['id']);
    const result = await teamService.getTeamMembers(teamId, req.userId!);
    if (!result.success) {
      if (result.message === '队伍不存在') {
        throw new NotFoundError(result.message);
      }
      if (result.message === '无权限查看此队伍成员') {
        throw new ForbiddenError(result.message);
      }
      throw new BadRequestError(result.message);
    }
    successResponse(res, result.data, '获取团队成员成功');
  })
);

export default router;
