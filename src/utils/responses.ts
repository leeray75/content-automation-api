import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export class ResponseHelper {
  static success<T>(res: Response, data: T, message?: string, statusCode = 200): Response {
    const response: ApiResponse<T> = {
      success: true,
      data,
      ...(message && { message }),
    };
    return res.status(statusCode).json(response);
  }

  static created<T>(res: Response, data: T, message?: string): Response {
    return ResponseHelper.success(res, data, message, 201);
  }

  static noContent(res: Response): Response {
    return res.status(204).send();
  }

  static error(
    res: Response,
    code: string,
    message: string,
    statusCode = 500,
    details?: any
  ): Response {
    const response: ApiResponse = {
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
      },
    };
    return res.status(statusCode).json(response);
  }

  static badRequest(res: Response, message: string, details?: any): Response {
    return ResponseHelper.error(res, 'BAD_REQUEST', message, 400, details);
  }

  static notFound(res: Response, resource = 'Resource'): Response {
    return ResponseHelper.error(res, 'NOT_FOUND', `${resource} not found`, 404);
  }

  static validationError(res: Response, details: any): Response {
    return ResponseHelper.error(
      res,
      'VALIDATION_ERROR',
      'Request validation failed',
      400,
      details
    );
  }

  static internalError(res: Response, message = 'Internal server error'): Response {
    return ResponseHelper.error(res, 'INTERNAL_ERROR', message, 500);
  }
}
