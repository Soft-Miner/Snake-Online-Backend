import app from '../../app';
import request from 'supertest';
import { createConnection } from 'typeorm';
import PopulateDatabase from '../populateDatabase';

describe('Auth', () => {
  beforeAll(async () => {
    const connection = await createConnection();
    await connection.dropDatabase();
    await connection.runMigrations();
    await PopulateDatabase(connection);
  });

  it('should be possible to get a token', async () => {
    const responseLoginWithNickname = await request(app)
      .post('/api/authenticate')
      .send({
        login: 'test',
        password: '123',
      });

    const responseLoginWithEmail = await request(app)
      .post('/api/authenticate')
      .send({
        login: 'test@test.com',
        password: '123',
      });

    expect(responseLoginWithNickname.status).toBe(200);
    expect(responseLoginWithNickname.body).toHaveProperty('access_token');
    expect(responseLoginWithNickname.body).toHaveProperty('refresh_token');
    expect(responseLoginWithNickname.body).toHaveProperty('user');
    expect(responseLoginWithEmail.status).toBe(200);
    expect(responseLoginWithEmail.body).toHaveProperty('access_token');
    expect(responseLoginWithEmail.body).toHaveProperty('refresh_token');
    expect(responseLoginWithEmail.body).toHaveProperty('user');
  });

  it('should return error if nickname/email or password are incorrect', async () => {
    const responseWithWrongEmail = await request(app)
      .post('/api/authenticate')
      .send({
        login: 'non-existent-email@example.com',
        password: '123',
      });
    const responseWithWrongNickname = await request(app)
      .post('/api/authenticate')
      .send({
        login: 'nonExistentNickname',
        password: '123',
      });
    const responseWithWrongPassword = await request(app)
      .post('/api/authenticate')
      .send({
        login: 'test',
        password: 'wrong-password',
      });

    expect(responseWithWrongEmail.status).toBe(401);
    expect(responseWithWrongEmail.body.message).toBe(
      'Nickname/email or password is incorrect.'
    );
    expect(responseWithWrongNickname.status).toBe(401);
    expect(responseWithWrongNickname.body.message).toBe(
      'Nickname/email or password is incorrect.'
    );
    expect(responseWithWrongPassword.status).toBe(401);
    expect(responseWithWrongPassword.body.message).toBe(
      'Nickname/email or password is incorrect.'
    );
  });

  it('should return error if data sent is wrong', async () => {
    const responseWithWrongEmail = await request(app)
      .post('/api/authenticate')
      .send({
        login: 'non-existent-email',
        password: '123',
      });
    const responseWithWrongNickname = await request(app)
      .post('/api/authenticate')
      .send({
        login: 'nonExistentNickname',
        password: '123',
      });
    const responseWithWrongPassword = await request(app)
      .post('/api/authenticate')
      .send({
        login: 'test@test.com',
        password: '',
      });

    expect(responseWithWrongEmail.status).toBe(401);
    expect(responseWithWrongEmail.body.message).toBe(
      'Nickname/email or password is incorrect.'
    );
    expect(responseWithWrongNickname.status).toBe(401);
    expect(responseWithWrongNickname.body.message).toBe(
      'Nickname/email or password is incorrect.'
    );
    expect(responseWithWrongPassword.status).toBe(401);
    expect(responseWithWrongPassword.body.message).toBe(
      'Nickname/email or password is incorrect.'
    );
  });
});
