import { Router } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';
import { asyncHandler, asyncAuthHandler } from '../middleware/asyncHandler.js';
import { authService } from '../services/authService.js';
import { successResponse } from '../utils/response.js';
import { validate, schemas } from '../utils/validation.js';
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
    successResponse(res, result, '注册成功', 201);
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { username, password } = validate<LoginRequest>(req.body, schemas.login);
    const result = await authService.login(username, password);
    successResponse(res, result, '登录成功');
  })
);

router.get(
  '/me',
  authMiddleware,
  asyncAuthHandler(async (req: AuthRequest, res) => {
    const result = await authService.getCurrentUser(req.userId!);
    successResponse(res, result, '获取用户信息成功');
  })
);

export default router;
