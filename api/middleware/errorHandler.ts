import type { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/errors.js';
import { errorResponse } from '../utils/response.js';

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const err = error as AppError & { errors?: Record<string, string> };

  if ('errors' in err && err.errors !== undefined) {
    errorResponse(res, err.message, err.statusCode || 400, err.errors);
    return;
  }

  if (err instanceof AppError || err.statusCode !== undefined) {
    errorResponse(res, err.message, err.statusCode || 500);
    return;
  }

  console.error('Unhandled error:', error);
  errorResponse(res, '服务器内部错误', 500);
};

export const notFoundHandler = (_req: Request, res: Response): void => {
  errorResponse(res, 'API 接口不存在', 404);
};
