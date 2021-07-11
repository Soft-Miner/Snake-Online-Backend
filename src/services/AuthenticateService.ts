import { getRepository, Repository } from 'typeorm';
import { AppError } from '../errors/AppError';
import User from '../models/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';

interface RefreshToken {
  id: string;
}

class AuthenticateService {
  private repository: Repository<User>;

  constructor() {
    this.repository = getRepository(User);
  }

  async authenticate(login: string, password: string) {
    const user = await this.repository.findOne({
      where: [{ email: login }, { nickname: login }],
    });

    if (!user) {
      throw new AppError('Nickname/email or password is incorrect.', 401);
    }

    const passwordIsValid = await bcrypt.compare(password, user.password);

    if (!passwordIsValid) {
      throw new AppError('Nickname/email or password is incorrect.', 401);
    }

    const access_token = jwt.sign(
      {
        id: user.id,
        typ: 'access',
      },
      process.env.JWT_SECRET as string,
      {
        jwtid: uuid(),
        expiresIn: 60 * 5, // 5 minutes
      }
    );

    const refresh_token = jwt.sign(
      {
        id: user.id,
        typ: 'refresh',
      },
      process.env.JWT_SECRET as string,
      {
        jwtid: uuid(),
        expiresIn: 60 * 30, // 30 minutes
      }
    );

    const refresh_token_hash = await bcrypt.hash(refresh_token, 10);

    user.refresh_token = refresh_token_hash;

    await this.repository.save(user);

    return {
      access_token,
      refresh_token,
      user,
    };
  }

  async refreshToken(refresh_token: string) {
    let decodedToken: RefreshToken;

    try {
      decodedToken = jwt.verify(
        refresh_token,
        process.env.JWT_SECRET as string
      ) as RefreshToken;
    } catch (error) {
      throw new AppError('Invalid refresh_token.');
    }

    const user = await this.repository.findOne(decodedToken.id);

    if (!user) {
      throw new AppError('Invalid refresh_token.');
    }

    const refreshTokenIsValid = await bcrypt.compare(
      refresh_token,
      user.refresh_token as string
    );

    if (!refreshTokenIsValid) {
      throw new AppError('Invalid refresh_token.');
    }

    const access_token = jwt.sign(
      {
        id: user.id,
        typ: 'access',
      },
      process.env.JWT_SECRET as string,
      {
        jwtid: uuid(),
        expiresIn: 60 * 5, // 5 minutes
      }
    );

    const new_refresh_token = jwt.sign(
      {
        id: user.id,
        typ: 'refresh',
      },
      process.env.JWT_SECRET as string,
      {
        jwtid: uuid(),
        expiresIn: 60 * 30, // 30 minutes
      }
    );

    const refresh_token_hash = await bcrypt.hash(new_refresh_token, 10);

    user.refresh_token = refresh_token_hash;

    await this.repository.save(user);

    return {
      refresh_token: new_refresh_token,
      access_token,
    };
  }
}

export default AuthenticateService;
