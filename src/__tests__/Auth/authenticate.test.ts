import { Server } from 'http';
import request, { SuperAgentTest } from 'supertest';
import { createConnection } from 'typeorm';
import app from '../../app';
import User from '../../models/User';
import createUser from '../utils/createUser';

let server: Server, agent: SuperAgentTest;

describe('Auth', () => {
  beforeAll(async (done) => {
    const connection = await createConnection();
    await connection.dropDatabase();
    await connection.runMigrations();

    server = app.listen(0, async () => {
      agent = request.agent(server);

      await createUser(connection, {
        nickname: 'Oosasukel',
        email: 'rodrigo_gonn@hotmail.com',
      } as User);

      done();
    });
  });

  afterAll((done) => {
    return server && server.close(done);
  });

  it('should be possible to get a token', async () => {
    const responseLoginWithNickname = await agent
      .post('/api/authenticate')
      .send({
        login: 'Oosasukel',
        password: '123',
      });

    const responseLoginWithEmail = await agent.post('/api/authenticate').send({
      login: 'rodrigo_gonn@hotmail.com',
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
    const responseWithWrongEmail = await agent.post('/api/authenticate').send({
      login: 'non-existent-email@example.com',
      password: '123',
    });
    const responseWithWrongPassword = await agent
      .post('/api/authenticate')
      .send({
        login: 'Oosasukel',
        password: '',
      });

    expect(responseWithWrongEmail.status).toBe(401);
    expect(responseWithWrongEmail.body.message).toBe(
      'Nickname/email or password is incorrect.'
    );
    expect(responseWithWrongPassword.status).toBe(401);
    expect(responseWithWrongPassword.body.message).toBe(
      'Nickname/email or password is incorrect.'
    );
  });
});
