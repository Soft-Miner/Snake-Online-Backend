import { Action, actions } from './actions';
import { Mutation, mutations } from './mutations';
import { PubSub } from './PubSub';
import { State, StoreParams } from './types';

const initialState: State = {
  rooms: [],
  users: [],
  games: [],
};

export class Store {
  private actions: typeof actions;
  private mutations: typeof mutations;
  state: State;
  status: string;
  events: PubSub;

  constructor(params: StoreParams) {
    this.actions = params.actions;
    this.mutations = params.mutations;
    this.events = new PubSub();
    this.state = new Proxy(params.state || initialState, {
      set: (state, key, value) => {
        state[key as keyof State] = value;
        this.events.publish('stateChange', this.state);
        return true;
      },
    });
  }

  dispatch(action: Action) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.actions[action.type](this, action.payload as any);
    /** @TODO Emitir evento de qual action foi disparada */
    return true;
  }

  commit(mutation: Mutation) {
    const newState = this.mutations[mutation.key](
      this.state,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mutation.payload as any
    );
    this.state = Object.assign(this.state, newState);
    return true;
  }
}

export default new Store({
  actions: actions,
  mutations: mutations,
});
