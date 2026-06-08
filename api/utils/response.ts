import type { Response } from 'express';
import type { ApiResponse } from '../../shared/types.js';

export const successResponse = <T>(
  res: Response,
  data: T,
  message: string = '操作成功',
  statusCode: number = 200
): Response<ApiResponse<T>> => {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
  });
};

export const errorResponse = <T = unknown>(
  res: Response,
  message: string,
  statusCode: number = 500,
  errors?: Record<string, string>
): Response<ApiResponse<T>> => {
  const response: ApiResponse<T> = {
    success: false,
    message,
  };
  if (errors) {
    (response as ApiResponse<T> & { errors: Record<string, string> }).errors = errors;
  }
  return res.status(statusCode).json(response);
};
