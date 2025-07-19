import { Request, Response, NextFunction } from 'express';
import { ApiError } from './errorHandler';

/**
 * Middleware to handle 404 Not Found errors
 */
export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  next(new ApiError(404, `Resource not found - ${req.originalUrl}`));
};