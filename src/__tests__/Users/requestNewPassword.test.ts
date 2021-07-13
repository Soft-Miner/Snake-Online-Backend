import { Server } from 'http';
import request, { SuperAgentTest } from 'supertest';
import { createConnection } from 'typeorm';
import app from '../../app';
import User from '../../models/User';
import createUser from '../utils/createUser';

let server: Server, agent: SuperAgentTest;

const mockSendEmail = jest.fn();

jest.mock('../../services/SendMailService.ts', () => ({
  execute: () => mockSendEmail(),
}));

describe('Request new password', () => {
  beforeAll(async (done) => {
    const connection = await createConnection();
    await connection.dropDatabase();
    await connection.runMigrations();

    server = app.listen(0, async () => {
      agent = request.agent(server);

      await createUser(connection, {
        email: 'rodrigo_gonn@hotmail.com',
      } as User);

      done();
    });
  });

  afterAll((done) => {
    return server && server.close(done);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return error if email is invalid', async () => {
    const response = await agent.post('/api/request-new-password').send({
      email: 'vitordom.com',
    });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid email.');
    expect(mockSendEmail).not.toBeCalled();
  });

  it('should return error if user do not exists', async () => {
    const response = await agent.post('/api/request-new-password').send({
      email: 'vitor@do.com',
    });
    expect(response.status).toBe(404);
    expect(response.body.message).toBe('User not found.');
    expect(mockSendEmail).not.toBeCalled();
  });

  it('should be possible to request a new password', async () => {
    const response = await agent.post('/api/request-new-password').send({
      email: 'rodrigo_gonn@hotmail.com',
    });
    expect(response.status).toBe(200);
    expect(response.body.message).toBe(
      'Password recovery email sent to rodrigo_gonn@hotmail.com.'
    );
    expect(mockSendEmail).toBeCalled();
  });
});
