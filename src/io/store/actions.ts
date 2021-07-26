import { actions as roomsActions } from './rooms';
import { ActionMap } from './types';
import { actions as usersActions } from './users';

export const actions = {
  ...roomsActions,
  ...usersActions,
};

export type Action = ActionMap<typeof actions>[keyof ActionMap<typeof actions>];
