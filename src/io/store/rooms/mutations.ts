import { State } from '../types';

interface MutationAddRoom {
  name: string;
}
export const addRoom = (state: State, payload: MutationAddRoom) => {
  state.rooms.push({ id: '123', name: payload.name, users: [] });
  return state;
};

interface MutationClearRoom {
  index: number;
}
export const clearRoom = (state: State, payload: MutationClearRoom) => {
  state.rooms.splice(payload.index, 1);
  return state;
};
