import { Store } from '..';

interface NewUserPayload {
  alo: string;
}
export const newUser = (context: Store, payload: NewUserPayload) => {
  context.commit({ key: 'addRoom', payload: { name: payload.alo } });
};

interface UpdateRoomPayload {
  galera: number;
}
export const updateRoom = (context: Store, payload: UpdateRoomPayload) => {
  context.commit({ key: 'clearRoom', payload: { index: payload.galera } });
};
