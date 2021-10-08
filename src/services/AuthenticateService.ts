import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getRepository, Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { AppError } from '../errors/AppError';
import User from '../models/User';

interface RefreshToken {
  id: string;
  jwtid: string;
}

class AuthenticateService {
  private repository: Repository<User>;

  constructor() {
    this.repository = getRepository(User);
  }

  private generateAccessToken(userId: string) {
    return jwt.sign(
      {
        id: userId,
        typ: 'access',
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn: '5m',
      }
    );
  }

  private generateRefreshToken(userId: string, refreshTokenId: string) {
    return jwt.sign(
      {
        id: userId,
        typ: 'refresh',
        jwtid: refreshTokenId,
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn: '30 days',
      }
    );
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

    const access_token = this.generateAccessToken(user.id);

    const refreshTokenId = uuid();
    const refresh_token = this.generateRefreshToken(user.id, refreshTokenId);

    user.refresh_token = refreshTokenId;

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

    if (user.refresh_token !== decodedToken.jwtid) {
      throw new AppError('Invalid refresh_token.');
    }

    const access_token = this.generateAccessToken(user.id);

    const refreshTokenId = uuid();
    const new_refresh_token = this.generateRefreshToken(
      user.id,
      refreshTokenId
    );

    user.refresh_token = refreshTokenId;

    await this.repository.save(user);

    return {
      refresh_token: new_refresh_token,
      access_token,
    };
  }
}

export default AuthenticateService;
