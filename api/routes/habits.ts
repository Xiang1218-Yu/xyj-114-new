import { Router } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';
import { asyncAuthHandler } from '../middleware/asyncHandler.js';
import { habitService } from '../services/habitService.js';
import { successResponse } from '../utils/response.js';
import { validate, validateParams, schemas } from '../utils/validation.js';
import type { CreateHabitRequest } from '../../shared/types.js';

const router = Router();

router.get(
  '/',
  authMiddleware,
  asyncAuthHandler(async (req: AuthRequest, res) => {
    const result = await habitService.getHabits(req.userId!);
    successResponse(res, result, '获取习惯列表成功');
  })
);

router.post(
  '/',
  authMiddleware,
  asyncAuthHandler(async (req: AuthRequest, res) => {
    const data = validate<CreateHabitRequest>(req.body, schemas.createHabit);
    const result = await habitService.createHabit(req.userId!, data);
    successResponse(res, result, '创建习惯成功', 201);
  })
);

router.put(
  '/:id',
  authMiddleware,
  asyncAuthHandler(async (req: AuthRequest, res) => {
    const [habitId] = validateParams(req.params, ['id']);
    const data = validate<Partial<CreateHabitRequest>>(req.body, schemas.updateHabit);
    const result = await habitService.updateHabit(req.userId!, habitId, data);
    successResponse(res, result, '更新习惯成功');
  })
);

router.delete(
  '/:id',
  authMiddleware,
  asyncAuthHandler(async (req: AuthRequest, res) => {
    const [habitId] = validateParams(req.params, ['id']);
    const result = await habitService.deleteHabit(req.userId!, habitId);
    successResponse(res, result, '删除习惯成功');
  })
);

export default router;
