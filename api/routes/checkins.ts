import { Router } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';
import { asyncAuthHandler } from '../middleware/asyncHandler.js';
import { checkinService } from '../services/checkinService.js';
import { successResponse } from '../utils/response.js';
import { validate, validateParams, schemas } from '../utils/validation.js';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors.js';
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
    if (!result.success) {
      if (result.message === '习惯不存在') {
        throw new NotFoundError(result.message);
      }
      if (result.message === '今日已打卡') {
        throw new ConflictError(result.message);
      }
      throw new BadRequestError(result.message);
    }
    successResponse(res, result.data, '签到成功', 201);
  })
);

router.put(
  '/:id/diary',
  authMiddleware,
  asyncAuthHandler(async (req: AuthRequest, res) => {
    const [checkinId] = validateParams(req.params, ['id']);
    const { mood, notes } = validate<UpdateCheckinDiaryRequest>(req.body, schemas.updateDiary);
    const result = await checkinService.updateDiary(req.userId!, checkinId, mood, notes);
    if (!result.success) {
      if (result.message === '打卡记录不存在') {
        throw new NotFoundError(result.message);
      }
      throw new BadRequestError(result.message);
    }
    successResponse(res, result.data, '更新日记成功');
  })
);

router.delete(
  '/',
  authMiddleware,
  asyncAuthHandler(async (req: AuthRequest, res) => {
    const { habitId, date } = validate(req.body, schemas.undoCheckin);
    const result = await checkinService.undoCheckin(req.userId!, habitId as number, date as string);
    if (!result.success) {
      if (result.message === '该日期没有打卡记录') {
        throw new NotFoundError(result.message);
      }
      throw new BadRequestError(result.message);
    }
    successResponse(res, result.data, '取消签到成功');
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
    if (!result.success) {
      throw new BadRequestError(result.message);
    }
    successResponse(res, result.data, '获取签到记录成功');
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
    if (!result.success) {
      throw new BadRequestError(result.message);
    }
    successResponse(res, result.data, '获取签到历史成功');
  })
);

router.get(
  '/calendar/:year/:month',
  authMiddleware,
  asyncAuthHandler(async (req: AuthRequest, res) => {
    const [year, month] = validateParams(req.params, ['year', 'month']);
    const result = await checkinService.getCheckinCalendar(req.userId!, year, month);
    if (!result.success) {
      throw new BadRequestError(result.message);
    }
    successResponse(res, result.data, '获取签到日历成功');
  })
);

export default router;
