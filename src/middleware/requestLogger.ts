import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const { method, url, ip } = req;
  const userAgent = req.get('User-Agent') || 'Unknown';

  // Log the incoming request
  logger.info(`${method} ${url} - ${ip} - ${userAgent}`);

  // Override res.end to log response details
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any): Response {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const contentLength = res.get('Content-Length') || '0';

    // Log the response
    logger.info(
      `${method} ${url} - ${statusCode} - ${duration}ms - ${contentLength} bytes`
    );

    // Call the original end method
    return originalEnd.call(this, chunk, encoding) as Response;
  };

  next();
};
