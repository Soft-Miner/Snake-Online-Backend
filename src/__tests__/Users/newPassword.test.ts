import { Server } from 'http';
import request, { SuperAgentTest } from 'supertest';
import { createConnection } from 'typeorm';
import app from '../../app';
import createResetRequest from '../utils/createResetRequest';

let server: Server, agent: SuperAgentTest;

let requestId: string;
let requestSecret: string;

describe('New password', () => {
  beforeAll(async (done) => {
    const connection = await createConnection();
    await connection.dropDatabase();
    await connection.runMigrations();

    server = app.listen(0, async () => {
      agent = request.agent(server);

      const resetRequest = await createResetRequest(connection);

      requestId = resetRequest.requestId;
      requestSecret = resetRequest.request_secret;

      done();
    });
  });

  afterAll((done) => {
    return server && server.close(done);
  });

  it('should return error if some sent data is empty', async () => {
    const responseWithoutRequestId = await agent
      .post('/api/users/new-password')
      .send({
        requestId: '',
        requestSecret: 'asd5ad4s',
        password: '12345',
      });
    const responseWithoutSecret = await agent
      .post('/api/users/new-password')
      .send({
        requestId: '54asd6as54d',
        requestSecret: '',
        password: '12345',
      });
    const responseWithoutPassword = await agent
      .post('/api/users/new-password')
      .send({
        requestId: '54asd6as54d',
        requestSecret: 'asd5ad4s',
        password: '',
      });
    expect(responseWithoutRequestId.status).toBe(400);
    expect(responseWithoutSecret.status).toBe(400);
    expect(responseWithoutPassword.status).toBe(400);
    expect(responseWithoutRequestId.body.message).toBe(
      'requestId, requestSecret and password are required.'
    );
    expect(responseWithoutSecret.body.message).toBe(
      'requestId, requestSecret and password are required.'
    );
    expect(responseWithoutPassword.body.message).toBe(
      'requestId, requestSecret and password are required.'
    );
  });

  it('should return error if requestId not found', async () => {
    const response = await agent.post('/api/users/new-password').send({
      requestId: '54asd6as5d',
      requestSecret,
      password: '5151',
    });
    expect(response.status).toBe(404);
    expect(response.body.message).toBe('requestId not found.');
  });

  it('should return error if requestSecret is invalid', async () => {
    const response = await agent.post('/api/users/new-password').send({
      requestId,
      requestSecret: '0123',
      password: '1234',
    });
    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid requestSecret.');
  });

  it('should be possible to change the password', async () => {
    const response = await agent.post('/api/users/new-password').send({
      requestId,
      requestSecret,
      password: '1234',
    });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Password successfully updated.');
  });
});
