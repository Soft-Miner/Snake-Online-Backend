import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError';

export const appError = () => {
  return (
    err: Error,
    request: Request,
    response: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: NextFunction
  ) => {
    if (err instanceof AppError) {
      return response.status(err.statusCode).json({
        message: err.message,
      });
    }

    return response.status(500).json({
      message: `Internal server error ${err.message}`,
    });
  };
};
