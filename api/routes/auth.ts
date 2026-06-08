import { Router } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';
import { asyncHandler, asyncAuthHandler } from '../middleware/asyncHandler.js';
import { authService } from '../services/authService.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { validate, schemas } from '../utils/validation.js';
import { ConflictError, UnauthorizedError, NotFoundError, BadRequestError } from '../utils/errors.js';
import type { LoginRequest, RegisterRequest } from '../../shared/types.js';

const router = Router();

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { username, email, password, confirmPassword } = validate<RegisterRequest>(
      req.body,
      schemas.register
    );
    const result = await authService.register(username, email, password, confirmPassword);
    if (!result.success) {
      if (result.message === '用户名已存在' || result.message === '邮箱已被注册') {
        throw new ConflictError(result.message);
      }
      throw new BadRequestError(result.message);
    }
    successResponse(res, result.data, '注册成功', 201);
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { username, password } = validate<LoginRequest>(req.body, schemas.login);
    const result = await authService.login(username, password);
    if (!result.success) {
      throw new UnauthorizedError(result.message);
    }
    successResponse(res, result.data, '登录成功');
  })
);

router.get(
  '/me',
  authMiddleware,
  asyncAuthHandler(async (req: AuthRequest, res) => {
    const result = await authService.getCurrentUser(req.userId!);
    if (!result.success) {
      throw new NotFoundError(result.message);
    }
    successResponse(res, result.data, '获取用户信息成功');
  })
);

export default router;
