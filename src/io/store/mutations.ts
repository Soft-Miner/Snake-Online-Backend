import { mutations as gamesMutations } from './games';
import { mutations as roomsMutations } from './rooms';
import { MutationMap } from './types';
import { mutations as usersMutations } from './users';

export const mutations = {
  ...roomsMutations,
  ...usersMutations,
  ...gamesMutations,
};

export type Mutation = MutationMap<typeof mutations>[keyof MutationMap<
  typeof mutations
>];
