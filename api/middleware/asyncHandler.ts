import type { Request, Response, NextFunction } from 'express';
import type { AuthRequest } from './auth.js';

type AsyncHandler<T extends Request = Request> = (
  req: T,
  res: Response,
  next: NextFunction
) => Promise<void>;

export const asyncHandler =
  <T extends Request = Request>(fn: AsyncHandler<T>) =>
  (req: T, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export const asyncAuthHandler = (fn: AsyncHandler<AuthRequest>) =>
  asyncHandler<AuthRequest>(fn);
