import type { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/errors.js';
import { errorResponse } from '../utils/response.js';

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (error instanceof ValidationError) {
    errorResponse(res, error.message, error.statusCode, error.errors);
    return;
  }

  if (error instanceof AppError) {
    errorResponse(res, error.message, error.statusCode);
    return;
  }

  console.error('Unhandled error:', error);
  errorResponse(res, '服务器内部错误', 500);
};

export const notFoundHandler = (_req: Request, res: Response): void => {
  errorResponse(res, 'API 接口不存在', 404);
};
