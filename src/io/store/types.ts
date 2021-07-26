import { Store } from '.';
import { actions } from './actions';
import { mutations } from './mutations';
import { Room } from './rooms/types';
import { User } from './users/types';

export interface State {
  rooms: Room[];
  users: User[];
}

export interface StoreParams {
  actions: typeof actions;
  mutations: typeof mutations;
  state?: State;
}

export type ActionMap<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  M extends { [index: string]: (context: Store, payload: any) => void }
> = {
  [Key in keyof M]: Parameters<M[Key]>[1] extends undefined
    ? {
        type: Key;
      }
    : {
        type: Key;
        payload: Parameters<M[Key]>[1];
      };
};

export type MutationMap<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  M extends { [index: string]: (context: State, payload: any) => void }
> = {
  [Key in keyof M]: Parameters<M[Key]>[1] extends undefined
    ? {
        key: Key;
      }
    : {
        key: Key;
        payload: Parameters<M[Key]>[1];
      };
};
