import { NextFunction, Request, Response } from 'express';
import * as yup from 'yup';
import { AppError } from '../errors/AppError';
import AuthenticateService from '../services/AuthenticateService';

class AuthenticateController {
  async authenticate(
    request: Request,
    response: Response,
    _next: NextFunction
  ) {
    const { login, password } = request.body;

    const schema = yup.object().shape({
      login: yup.string().required(),
      password: yup.string().required(),
    });

    try {
      await schema.validate(request.body);
    } catch (error) {
      return _next(
        new AppError('Nickname/email or password is incorrect.', 401)
      );
    }

    try {
      const { access_token, refresh_token, user } =
        await new AuthenticateService().authenticate(login, password);

      response.status(200).json({
        access_token,
        refresh_token,
        user: {
          id: user.id,
          nickname: user.nickname,
          email: user.email,
        },
      });
    } catch (error) {
      return _next(error);
    }
  }

  async refreshToken(
    request: Request,
    response: Response,
    _next: NextFunction
  ) {
    const { refresh_token } = request.body;

    const schema = yup.object().shape({
      refresh_token: yup.string().required(),
    });

    try {
      await schema.validate(request.body);
    } catch (error) {
      return _next(new AppError('Invalid refresh_token.'));
    }

    try {
      const { access_token, refresh_token: new_refresh_token } =
        await new AuthenticateService().refreshToken(refresh_token);

      return response.status(200).json({
        access_token,
        refresh_token: new_refresh_token,
      });
    } catch (error) {
      return _next(error);
    }
  }
}

export default AuthenticateController;
