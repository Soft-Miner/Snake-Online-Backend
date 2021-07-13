import request from 'supertest';
import { createConnection } from 'typeorm';
import app from '../../app';
import PopulateDatabase from '../populateDatabase';

describe('Create new users', () => {
  beforeAll(async () => {
    const connection = await createConnection();
    await connection.dropDatabase();
    await connection.runMigrations();
    await PopulateDatabase(connection);
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be possible to create a new user', async () => {
    const response = await request(app).post('/api/register').send({
      nickname: 'Vitor',
      email: 'email@example.com',
      password: '123',
    });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('User successfully created.');
    expect(response.body.user).toHaveProperty('id');
    expect(response.body.user.nickname).toBe('Vitor');
    expect(response.body.user.email).toBe('email@example.com');
  });

  it('should return error if params is incorret', async () => {
    const response = await request(app).post('/api/register').send({
      nickname: 'Vitor',
      email: 'email@example.com',
      password: '',
    });

    const responseEmailInvalid = await request(app).post('/api/register').send({
      nickname: 'Vitor',
      email: 'lolpellolDotcom',
      password: '123',
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Something wrong with the request.');
    expect(responseEmailInvalid.status).toBe(400);
    expect(responseEmailInvalid.body.message).toBe(
      'Something wrong with the request.'
    );
  });

  it('should return error if user already exists', async () => {
    const responseWithSameEmail = await request(app)
      .post('/api/register')
      .send({
        nickname: 'llpo',
        email: 'test@test.com',
        password: '123',
      });

    const responseWithSameNickname = await request(app)
      .post('/api/register')
      .send({
        nickname: 'test',
        email: 'test@test2.com',
        password: '123',
      });

    expect(responseWithSameEmail.status).toBe(400);
    expect(responseWithSameEmail.body.message).toBe(
      'A user already exists with this email.'
    );
    expect(responseWithSameNickname.status).toBe(400);
    expect(responseWithSameNickname.body.message).toBe(
      'A user already exists with this nickname.'
    );
  });
});
