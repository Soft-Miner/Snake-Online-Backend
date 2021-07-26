import { State } from '../types';

interface MutationAddUser {
  name: string;
}
export const addUser = (state: State, payload: MutationAddUser) => {
  state.users.push({
    id: '123',
    email: 'a',
    nickname: payload.name,
    points: 0,
  });
  return state;
};

interface MutationClearUser {
  index: number;
}
export const clearUser = (state: State, payload: MutationClearUser) => {
  state.users.splice(payload.index, 1);
  return state;
};
