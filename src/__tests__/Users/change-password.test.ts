import app from '../../app';
import { Server } from 'http';
import request, { SuperAgentTest } from 'supertest';
import { createConnection } from 'typeorm';
import jwt from 'jsonwebtoken';
import createUser from '../utils/createUser';

let server: Server, agent: SuperAgentTest;
let token: string;
const tokenOfNonExistentUser = jwt.sign(
  {
    id: 'some-id',
    typ: 'access',
  },
  process.env.JWT_SECRET as string
);

describe('Update password', () => {
  beforeAll(async (done) => {
    const connection = await createConnection();
    await connection.dropDatabase();
    await connection.runMigrations();

    server = app.listen(0, async () => {
      agent = request.agent(server);

      const { access_token } = await createUser(connection);
      token = access_token;

      done();
    });
  });

  afterAll((done) => {
    return server && server.close(done);
  });

  it('should be possible to update password', async () => {
    const response = await agent
      .put('/api/users/change-password')
      .set('authorization', `Bearer ${token}`)
      .send({
        password: '123',
        new_password: '1234',
      });

    expect(response.body.message).toBe('Password updated.');
    expect(response.status).toBe(200);
  });

  it('should return an error if the token is invalid', async () => {
    const response = await agent
      .put('/api/users/change-password')
      .set('authorization', `Bearer 123`)
      .send({
        password: '123',
        new_password: '1234',
      });

    expect(response.body.message).toBe('Invalid token.');
    expect(response.status).toBe(401);
  });

  it('should return an error if the user does not exists', async () => {
    const response = await agent
      .put('/api/users/change-password')
      .set('authorization', `Bearer ${tokenOfNonExistentUser}`)
      .send({
        password: '123',
        new_password: '1234',
      });

    expect(response.body.message).toBe('User not found.');
    expect(response.status).toBe(404);
  });

  it('should return an error if some data format is invalid', async () => {
    const response = await agent
      .put('/api/users/change-password')
      .set('authorization', `Bearer ${token}`)
      .send({
        password: '123',
        new_password: '',
      });

    expect(response.body.message).toBe('Something wrong with the request.');
    expect(response.status).toBe(400);
  });

  it('should return error if the password is incorrect', async () => {
    const response = await agent
      .put('/api/users/change-password')
      .set('authorization', `Bearer ${token}`)
      .send({
        password: '12',
        new_password: '1234',
      });

    expect(response.body.message).toBe('Password is incorrect.');
    expect(response.status).toBe(401);
  });
});
