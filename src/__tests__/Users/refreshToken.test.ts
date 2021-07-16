import app from '../../app';
import { Server } from 'http';
import request, { SuperAgentTest } from 'supertest';
import { createConnection, getRepository } from 'typeorm';
import User from '../../models/User';
import createUser from '../utils/createUser';

let server: Server, agent: SuperAgentTest;

let refresh_token: string;
let id: string;

describe('User refreshToken', () => {
  beforeAll(async (done) => {
    const connection = await createConnection();
    await connection.dropDatabase();
    await connection.runMigrations();

    server = app.listen(0, async () => {
      agent = request.agent(server);

      const { refresh_token: token, user } = await createUser(connection);
      refresh_token = token;
      id = user.id;

      done();
    });
  });

  afterAll((done) => {
    return server && server.close(done);
  });

  it('should be possible to get a new access_token with a valid refresh_token', async () => {
    const response = await agent.post('/api/refresh_token').send({
      refresh_token,
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('access_token');
    expect(response.body).toHaveProperty('refresh_token');
  });

  it('should not be possible to use a refresh_token twice', async () => {
    const response = await agent.post('/api/refresh_token').send({
      refresh_token,
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid refresh_token.');
  });

  it('should return error if sent token is invalid', async () => {
    const responseEmptyToken = await agent.post('/api/refresh_token').send({
      refresh_token: '',
    });
    const responseInvalidToken = await agent.post('/api/refresh_token').send({
      refresh_token: '123',
    });

    expect(responseEmptyToken.status).toBe(400);
    expect(responseEmptyToken.body.message).toBe('Invalid refresh_token.');
    expect(responseInvalidToken.status).toBe(400);
    expect(responseInvalidToken.body.message).toBe('Invalid refresh_token.');
  });

  it('should return error if superUser does not exists', async () => {
    const usersRepository = getRepository(User);
    await usersRepository.delete(id);

    const response = await agent.post('/api/refresh_token').send({
      refresh_token,
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid refresh_token.');
  });
});
