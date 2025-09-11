import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';
import { ResponseHelper } from '../utils/responses';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  error: AppError | ZodError | Error,
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  // Log the error
  logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
  });

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const validationErrors = error.issues.map((err: any) => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    }));

    return ResponseHelper.validationError(res, validationErrors);
  }

  // Handle custom app errors
  if ('statusCode' in error && error.statusCode) {
    return ResponseHelper.error(
      res,
      error.code || 'APP_ERROR',
      error.message,
      error.statusCode
    );
  }

  // Handle generic errors
  const isDevelopment = process.env.NODE_ENV === 'development';
  const message = isDevelopment ? error.message : 'Internal server error';
  const details = isDevelopment ? { stack: error.stack } : undefined;

  return ResponseHelper.error(
    res,
    'INTERNAL_ERROR',
    message,
    500,
    details
  );
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
