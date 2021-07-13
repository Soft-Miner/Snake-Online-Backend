import request from 'supertest';
import { createConnection } from 'typeorm';
import app from '../../app';
import PopulateDatabase from '../populateDatabase';

const mockSendEmail = jest.fn();

jest.mock('../../services/SendMailService.ts', () => ({
  execute: () => mockSendEmail(),
}));

describe('Request new password', () => {
  beforeAll(async () => {
    const connection = await createConnection();
    await connection.dropDatabase();
    await connection.runMigrations();
    await PopulateDatabase(connection);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return error if email is invalid', async () => {
    const response = await request(app).post('/api/request-new-password').send({
      email: 'vitordom.com',
    });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid email.');
    expect(mockSendEmail).not.toBeCalled();
  });

  it('should return error if user do not exists', async () => {
    const response = await request(app).post('/api/request-new-password').send({
      email: 'vitor@do.com',
    });
    expect(response.status).toBe(404);
    expect(response.body.message).toBe('User not found.');
    expect(mockSendEmail).not.toBeCalled();
  });

  it('should be possible to request a new password', async () => {
    const response = await request(app).post('/api/request-new-password').send({
      email: 'test@test.com',
    });
    expect(response.status).toBe(200);
    expect(response.body.message).toBe(
      'Password recovery email sent to test@test.com.'
    );
    expect(mockSendEmail).toBeCalled();
  });
});
