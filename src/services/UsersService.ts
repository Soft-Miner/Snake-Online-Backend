import { getManager, getRepository, Repository } from 'typeorm';
import User from '../models/User';
import { AppError } from '../errors/AppError';
import bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import PasswordResetRequest from '../models/PasswordResetRequest';
import SendMailService from './SendMailService';
import { resolve } from 'path';

class UsersService {
  private repository: Repository<User>;

  constructor() {
    this.repository = getRepository(User);
  }

  async create(
    nickname: string,
    password: string,
    email: string
  ): Promise<User> {
    const userWithThisEmail = await this.repository.findOne({ email });

    if (userWithThisEmail) {
      throw new AppError('A user already exists with this email.');
    }

    const userWithThisNickname = await this.repository.findOne({ nickname });

    if (userWithThisNickname) {
      throw new AppError('A user already exists with this nickname.');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = this.repository.create({
      nickname,
      password: passwordHash,
      email,
      points: 0,
    });

    await this.repository.save(user);

    return user;
  }

  async requestNewPassword(email: string): Promise<void> {
    const user = await this.repository.findOne({ email });

    if (!user) {
      throw new AppError('User not found.', 404);
    }

    const requestSecret = uuid();
    const requestSecretHash = await bcrypt.hash(requestSecret, 10);

    const resetRequestsRepository = getRepository(PasswordResetRequest);

    const resetRequestFromThisUser = await resetRequestsRepository.findOne({
      user_id: user.id,
    });

    let resetRequest: PasswordResetRequest;

    if (resetRequestFromThisUser) {
      resetRequest = resetRequestFromThisUser;
      resetRequest.request_secret = requestSecretHash;
    } else {
      resetRequest = resetRequestsRepository.create({
        request_secret: requestSecretHash,
        user_id: user.id,
      });
    }

    await resetRequestsRepository.save(resetRequest);

    await SendMailService.execute({
      to: email,
      subject: 'Recover Password',
      variables: {
        nickname: user.nickname,
        link: `${process.env.FRONTEND_URL}/reset-password/${resetRequest.id}/${requestSecret}`,
      },
      path: resolve(__dirname, '../../views/emails/recoverPassword.hbs'),
    });
  }

  async newPassword(
    requestId: string,
    requestSecret: string,
    password: string
  ): Promise<void> {
    const resetRequestsRepository = getRepository(PasswordResetRequest);

    const resetRequest = await resetRequestsRepository.findOne(requestId);

    if (!resetRequest) {
      throw new AppError('requestId not found.', 404);
    }

    const validRequestSecret = await bcrypt.compare(
      requestSecret,
      resetRequest.request_secret
    );

    if (!validRequestSecret) {
      throw new AppError('Invalid requestSecret.', 401);
    }

    const user = (await this.repository.findOne(resetRequest.user_id)) as User;

    const passwordHash = await bcrypt.hash(password, 10);

    user.password = passwordHash;

    await getManager().transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager.save(user);
      await transactionalEntityManager.remove(resetRequest);
    });
  }

  async updatePassword(id: string, password: string, new_password: string) {
    const user = await this.repository.findOne(id);

    if (!user) {
      throw new AppError('User not found.', 404);
    }

    const passwordIsValid = await bcrypt.compare(password, user.password);

    if (!passwordIsValid) {
      throw new AppError('Password is incorrect.', 401);
    }

    const passwordHash = await bcrypt.hash(new_password, 10);

    user.password = passwordHash;

    await this.repository.save(user);
  }
}

export default UsersService;
