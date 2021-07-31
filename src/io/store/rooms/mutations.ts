import { Server, Socket } from 'socket.io';
import { v4 as uuid } from 'uuid';
import { State } from '../types';
import { Game, Room } from './types';
import { formatRoomsToHome } from './utils/formatRoomsToHome';

interface CreateRoomPayload {
  name: string;
  socket: Socket;
}
export const createRoom = (state: State, payload: CreateRoomPayload) => {
  const { name, socket } = payload;

  const roomExists = state.rooms.find((item) => item.name === name);

  if (roomExists) {
    socket.emit('error', 'Room already exists.');
    return state;
  }

  const newRoom: Room = {
    id: uuid(),
    name,
    users: [
      {
        email: socket.user.email,
        id: socket.user.id,
        nickname: socket.user.nickname,
        points: socket.user.points,
        ready: false,
      },
    ],
    owner: socket.user.id,
    mapSize: 12,
    game: null,
    slots: [
      socket.user.id,
      'open',
      'open',
      'open',
      'closed',
      'closed',
      'closed',
      'closed',
      'closed',
      'closed',
      'closed',
      'closed',
    ],
  };

  state.rooms.push(newRoom);

  socket.emit('room-successfuly-created', newRoom);
  socket.leave('home');
  socket.join(newRoom.id);

  socket.to('home').emit('rooms-updated', formatRoomsToHome(state.rooms));

  return state;
};

interface JoinRoomPayload {
  id: string;
  socket: Socket;
}
export const joinRoom = (state: State, payload: JoinRoomPayload) => {
  const { id, socket } = payload;

  const room = state.rooms.find((item) => item.id === id);
  if (!room) {
    throw new Error('Room not found.');
  }

  const slotOpenIndex = room.slots.findIndex((item) => item === 'open');
  if (slotOpenIndex === -1) {
    throw new Error('The room is full.');
  }

  const userAlreadyIsInTheRoom = room.users.find(
    (item) => item.id === socket.user.id
  );
  if (userAlreadyIsInTheRoom) {
    throw new Error('User already is in the room.');
  }

  room.slots.splice(slotOpenIndex, 1, socket.user.id);
  room.users.push({
    id: socket.user.id,
    email: socket.user.email,
    nickname: socket.user.nickname,
    points: socket.user.points,
    ready: false,
  });

  for (const room of socket.rooms) {
    if (room !== socket.id) {
      socket.leave(room);
    }
  }

  socket.join(id);
  socket.emit('joined-room', room);
  socket.to(room.id).emit('new-user-joined-room', room);

  socket.to('home').emit('rooms-updated', formatRoomsToHome(state.rooms));

  return state;
};

interface LeaveRoomPayload {
  socket: Socket;
  io: Server;
}
export const leaveRoom = (state: State, payload: LeaveRoomPayload) => {
  const { socket, io } = payload;

  for (const room of socket.rooms) {
    if (room !== socket.id) {
      const roomToLeave = state.rooms.find((item) => item.id === room);
      if (roomToLeave) {
        const hasMoreUsers = roomToLeave.users.length > 1;
        const userIsOwner = roomToLeave.owner === socket.user.id;

        if (hasMoreUsers) {
          if (userIsOwner) {
            const anotherUser = roomToLeave.users.find(
              (item) => item.id !== socket.user.id
            );
            if (anotherUser) {
              roomToLeave.owner = anotherUser.id as string;
              anotherUser.ready = false;
            }
          }

          const userSlotIndex = roomToLeave.slots.findIndex(
            (item) => item === socket.user.id
          );
          roomToLeave.slots.splice(userSlotIndex, 1, 'open');
          const userIndex = roomToLeave.users.findIndex(
            (item) => item.id === socket.user.id
          );
          roomToLeave.users.splice(userIndex, 1);

          socket.to(roomToLeave.id).emit('user-left-room', roomToLeave);
        } else {
          const roomIndex = state.rooms.findIndex(
            (item) => item.id === roomToLeave.id
          );
          state.rooms.splice(roomIndex, 1);
        }
      }

      socket.leave(room);
      socket.emit('left-room');
    }
  }

  socket.join('home');
  io.to('home').emit('rooms-updated', formatRoomsToHome(state.rooms));

  return state;
};

interface KickPlayerPayload {
  socket: Socket;
  io: Server;
  userId: string;
}
export const kickPlayer = (state: State, payload: KickPlayerPayload) => {
  const { socket, io, userId } = payload;

  for (const room of socket.rooms) {
    if (socket.user.id === userId) break;

    if (room !== socket.id) {
      const currentRoom = state.rooms.find((item) => item.id === room);
      if (!currentRoom) continue;
      if (currentRoom.owner !== socket.user.id) continue;

      const userIndex = currentRoom.users.findIndex(
        (item) => item.id === userId
      );
      if (userIndex === -1) continue;

      const userSlotIndex = currentRoom.slots.findIndex(
        (item) => item === userId
      );

      currentRoom.slots.splice(userSlotIndex, 1, 'open');
      currentRoom.users.splice(userIndex, 1);

      const kickedUser = state.users.find((item) => item.id === userId);

      if (kickedUser) {
        io.to(kickedUser.socket.id).emit('left-room');
        kickedUser.socket.join('home');
      }

      io.to(currentRoom.id).emit('user-left-room', currentRoom);
    }
  }

  io.to('home').emit('rooms-updated', formatRoomsToHome(state.rooms));

  return state;
};

interface OpenSlotPayload {
  socket: Socket;
  io: Server;
  index: number;
}
export const openSlot = (state: State, payload: OpenSlotPayload) => {
  const { socket, io, index } = payload;

  for (const room of socket.rooms) {
    if (room !== socket.id) {
      const currentRoom = state.rooms.find((item) => item.id === room);
      if (!currentRoom) continue;
      if (currentRoom.owner !== socket.user.id) continue;
      if (!currentRoom.slots[index] || currentRoom.slots[index] !== 'closed')
        continue;

      currentRoom.slots[index] = 'open';

      io.to(room).emit('slot-updated', index, 'open');
    }
  }

  io.to('home').emit('rooms-updated', formatRoomsToHome(state.rooms));

  return state;
};

interface CloseSlotPayload {
  socket: Socket;
  io: Server;
  index: number;
}
export const closeSlot = (state: State, payload: CloseSlotPayload) => {
  const { socket, io, index } = payload;

  for (const room of socket.rooms) {
    if (room !== socket.id) {
      const currentRoom = state.rooms.find((item) => item.id === room);
      if (!currentRoom) continue;
      if (currentRoom.owner !== socket.user.id) continue;
      if (!currentRoom.slots[index] || currentRoom.slots[index] === 'closed')
        continue;

      currentRoom.slots[index] = 'closed';

      io.to(room).emit('slot-updated', index, 'closed');
    }
  }

  io.to('home').emit('rooms-updated', formatRoomsToHome(state.rooms));

  return state;
};

interface GameReadyPayload {
  socket: Socket;
  io: Server;
  ready: boolean;
}
export const gameReady = (state: State, payload: GameReadyPayload) => {
  const { socket, io, ready } = payload;

  for (const room of socket.rooms) {
    if (room !== socket.id) {
      const currentRoom = state.rooms.find((item) => item.id === room);
      if (!currentRoom) continue;
      if (currentRoom.game) continue;

      const isOwner = currentRoom.owner === socket.user.id;

      if (isOwner && !ready) continue;

      if (isOwner) {
        const allPlayersAccepted =
          currentRoom.users.filter(
            (user) => !user.ready && user.id !== socket.user.id
          ).length === 0;

        if (!allPlayersAccepted) {
          socket.emit('error', 'All players need accept.');
          continue;
        }

        /** @TODO Colocar games no state */
        const newGame: Game = {
          id: uuid(),
          roomId: currentRoom.id,
          fruits: [{ x: 2, y: 2 }],
          mapSize: currentRoom.mapSize,
          users: currentRoom.users.map((user) => ({
            id: user.id,
            gamePoints: 1,
            body: [],
            head: { x: 5, y: 5 },
            direction: { x: 1, y: 0 },
          })),
        };

        currentRoom.game = newGame.id;

        io.to(room).emit('game-started', newGame);
        io.to('home').emit('rooms-updated', formatRoomsToHome(state.rooms));
      } else {
        const userToUpdate = currentRoom.users.find(
          (item) => item.id === socket.user.id
        );

        if (!userToUpdate) continue;

        userToUpdate.ready = ready;

        io.to(room).emit('room-user-changed', currentRoom);
      }
    }
  }

  return state;
};

interface UpdateConfigPayload {
  socket: Socket;
  io: Server;
  config: {
    size: number;
  };
}
export const updateConfig = (state: State, payload: UpdateConfigPayload) => {
  const {
    socket,
    io,
    config: { size },
  } = payload;

  for (const room of socket.rooms) {
    if (room !== socket.id) {
      const currentRoom = state.rooms.find((item) => item.id === room);
      if (!currentRoom) continue;

      const isOwner = currentRoom.owner === socket.user.id;
      if (!isOwner) continue;

      currentRoom.mapSize = size;

      io.to(room).emit('room:config-updated', currentRoom);
      io.to('home').emit('rooms-updated', formatRoomsToHome(state.rooms));
    }
  }

  return state;
};
