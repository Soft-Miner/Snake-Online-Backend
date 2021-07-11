import { NextFunction, Request, Response } from 'express';
import * as yup from 'yup';
import { AppError } from '../errors/AppError';
import UsersService from '../services/UsersService';

class UsersController {
  async create(request: Request, response: Response, _next: NextFunction) {
    const { nickname, password, email } = request.body;

    const schema = yup.object().shape({
      nickname: yup
        .string()
        .matches(/^[^@]+$/)
        .max(25)
        .required(),
      password: yup.string().required(),
      email: yup.string().email().required(),
    });

    const nicknameFormatted = nickname.trim().replace(/ +(?= )/g, '');

    try {
      await schema.validate(request.body);
    } catch (error) {
      return _next(new AppError('Something wrong with the request.'));
    }

    try {
      const user = await new UsersService().create(
        nicknameFormatted,
        password,
        email
      );
      return response.status(201).json({
        message: 'User successfuly created.',
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

  async requestNewPassword(
    request: Request,
    response: Response,
    _next: NextFunction
  ) {
    const { email } = request.body;

    const schema = yup.object().shape({
      email: yup.string().email().required(),
    });

    try {
      await schema.validate(request.body);
    } catch (error) {
      return _next(new AppError('Invalid email.'));
    }

    try {
      await new UsersService().requestNewPassword(email);

      return response.status(200).json({
        message: `Password recovery email sent to ${email}.`,
      });
    } catch (error) {
      return _next(error);
    }
  }

  async newPassword(request: Request, response: Response, _next: NextFunction) {
    const { requestId, requestSecret, password } = request.body;

    const schema = yup.object().shape({
      requestId: yup.string().required(),
      requestSecret: yup.string().required(),
      password: yup.string().required(),
    });

    try {
      await schema.validate(request.body);
    } catch (error) {
      return _next(
        new AppError('requestId, requestSecret and password are required.')
      );
    }

    try {
      await new UsersService().newPassword(requestId, requestSecret, password);

      return response.status(200).json({
        message: 'Password successfully updated.',
      });
    } catch (error) {
      return _next(error);
    }
  }

  async updatePassword(
    request: Request,
    response: Response,
    _next: NextFunction
  ) {
    const { password, new_password } = request.body;
    const { userId } = request;

    const schema = yup.object().shape({
      password: yup.string().required(),
      new_password: yup.string().required(),
    });

    try {
      await schema.validate(request.body);
    } catch (error) {
      return _next(new AppError('Something wrong with the request.'));
    }

    try {
      await new UsersService().updatePassword(
        userId as string,
        password,
        new_password
      );

      return response.status(200).json({
        message: 'Password updated.',
      });
    } catch (error) {
      return _next(error);
    }
  }
}

export default UsersController;
