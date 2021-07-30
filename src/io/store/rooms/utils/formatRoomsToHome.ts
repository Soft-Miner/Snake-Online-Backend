import { Room } from '../types';

interface HomeRoom {
  id: string;
  name: string;
  maxUsers: number;
  currentUsers: number;
  playing: boolean;
}

export const formatRoomsToHome = (rooms: Room[]): HomeRoom[] => {
  return rooms.map((room) => {
    const maxUsers = room.slots.filter((slot) => slot !== 'closed').length;
    const currentUsers = room.users.length;
    const playing = !!room.game;

    return {
      id: room.id,
      name: room.name,
      currentUsers,
      maxUsers,
      playing,
    };
  });
};
