import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../errors/AppError';

interface tokenPayload {
  id: string;
  typ: string;
}

export const verifyJWT = () => {
  return (request: Request, response: Response, _next: NextFunction) => {
    const authorization = request.headers['authorization'];
    const token = authorization?.split(' ')[1];

    if (!token) throw new AppError('Invalid token.', 401);

    jwt.verify(token, process.env.JWT_SECRET as string, (error, decoded) => {
      const payload = decoded as tokenPayload;

      if (error || payload.typ !== 'access') {
        throw new AppError('Invalid token.', 401);
      }

      if (decoded) {
        request.userId = payload.id;
      }

      return _next();
    });
  };
};
