import { Router } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';
import { asyncAuthHandler } from '../middleware/asyncHandler.js';
import { checkinService } from '../services/checkinService.js';
import { successResponse } from '../utils/response.js';
import { validate, validateParams, schemas } from '../utils/validation.js';
import { BadRequestError } from '../utils/errors.js';
import type { CreateCheckinRequest, UpdateCheckinDiaryRequest } from '../../shared/types.js';

const router = Router();

router.post(
  '/',
  authMiddleware,
  asyncAuthHandler(async (req: AuthRequest, res) => {
    const { habitId, date, mood, notes } = validate<CreateCheckinRequest>(
      req.body,
      schemas.checkin
    );
    const result = await checkinService.checkin(req.userId!, habitId, date, mood, notes);
    successResponse(res, result, '签到成功', 201);
  })
);

router.put(
  '/:id/diary',
  authMiddleware,
  asyncAuthHandler(async (req: AuthRequest, res) => {
    const [checkinId] = validateParams(req.params, ['id']);
    const { mood, notes } = validate<UpdateCheckinDiaryRequest>(req.body, schemas.updateDiary);
    const result = await checkinService.updateDiary(req.userId!, checkinId, mood, notes);
    successResponse(res, result, '更新日记成功');
  })
);

router.delete(
  '/',
  authMiddleware,
  asyncAuthHandler(async (req: AuthRequest, res) => {
    const { habitId, date } = validate(req.body, schemas.undoCheckin);
    const result = await checkinService.undoCheckin(req.userId!, habitId as number, date as string);
    successResponse(res, result, '取消签到成功');
  })
);

router.get(
  '/:date',
  authMiddleware,
  asyncAuthHandler(async (req: AuthRequest, res) => {
    const { date } = req.params;
    if (!date) {
      throw new BadRequestError('日期参数不能为空');
    }
    const result = await checkinService.getCheckinsByDate(req.userId!, date);
    successResponse(res, result, '获取签到记录成功');
  })
);

router.get(
  '/history/list',
  authMiddleware,
  asyncAuthHandler(async (req: AuthRequest, res) => {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      throw new BadRequestError('开始日期和结束日期不能为空');
    }
    const result = await checkinService.getCheckinHistory(
      req.userId!,
      startDate as string,
      endDate as string
    );
    successResponse(res, result, '获取签到历史成功');
  })
);

router.get(
  '/calendar/:year/:month',
  authMiddleware,
  asyncAuthHandler(async (req: AuthRequest, res) => {
    const [year, month] = validateParams(req.params, ['year', 'month']);
    const result = await checkinService.getCheckinCalendar(req.userId!, year, month);
    successResponse(res, result, '获取签到日历成功');
  })
);

export default router;
