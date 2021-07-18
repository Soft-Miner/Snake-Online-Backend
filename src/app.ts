import cors from 'cors';
import express from 'express';
import 'express-async-errors';
import 'reflect-metadata';
import swaggerUi from 'swagger-ui-express';
import { appError } from './middlewares/appError';
import routes from './routes';
import swaggerDocs from './swagger.json';
import http from 'http';
import { Server } from 'socket.io';
import { getRepository } from 'typeorm';
import jwt from 'jsonwebtoken';
import User from './models/User';
import { tokenPayload } from './middlewares/verifyJWT';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {},
});

app.use(express.json());
app.use(cors());

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use('/api', routes);
app.use(appError());

interface Message {
  sender: string;
  text: string;
}

interface SocketUser {
  id: string;
  nickname: string;
  email: string;
  points: number;
}

io.use((socket, next) => {
  if (
    socket.handshake.query &&
    typeof socket.handshake.query.token === 'string'
  ) {
    jwt.verify(
      socket.handshake.query.token,
      process.env.JWT_SECRET as string,
      async (err, decoded) => {
        if (err) return next(new Error('Invalid token.'));

        const usersRepository = getRepository(User);
        const user = await usersRepository.findOne(
          (decoded as tokenPayload).id,
          { select: ['id', 'email', 'nickname', 'points'] }
        );

        if (!user) {
          return next(new Error('User not found.'));
        }

        socket.user = user as SocketUser;

        next();
      }
    );
  } else {
    next(new Error('Invalid token.'));
  }
});
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user}`);

  socket.on('message', (message) => {
    const messagePayload: Message = {
      text: message,
      sender: socket.user.nickname,
    };

    socket.broadcast.emit('message', messagePayload);
  });
});

export default server;
