import { Socket } from 'socket.io';
import { v4 as uuid } from 'uuid';
import { State } from '../types';

interface CreateRoomPayload {
  name: string;
  socket: Socket;
}
export const createRoom = (state: State, payload: CreateRoomPayload) => {
  const { name, socket } = payload;

  const roomExists = state.rooms.find((item) => item.name === name);

  if (roomExists) {
    throw new Error('Room already exists.');
  }

  const newRoom = {
    id: uuid(),
    name,
    users: [{ ...socket.user, ready: false }],
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
  /** @TODO emitir somente o necessário */
  socket.to('home').emit('rooms-updated', state.rooms);

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
  room.users.push({ ...socket.user, ready: false });

  socket.leave('home');
  socket.join(id);
  socket.emit('joined-room', room);
  socket.to(room.id).emit('new-user-joined-room', room);
  /** @TODO emitir somente o necessário */
  socket.to('home').emit('rooms-updated', state.rooms);

  return state;
};

interface LeaveRoomPayload {
  socket: Socket;
}
export const leaveRoom = (state: State, payload: LeaveRoomPayload) => {
  const { socket } = payload;

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
            roomToLeave.owner = anotherUser?.id as string;
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
    }
  }

  return state;
};
