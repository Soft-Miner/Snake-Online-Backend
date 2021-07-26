import { Store } from '..';

interface NewRoomPayload {
  alo: string;
}
export const newRoom = (context: Store, payload: NewRoomPayload) => {
  context.commit({ key: 'addRoom', payload: { name: payload.alo } });
};

interface UpdateRoomPayload {
  galera: number;
}
export const updateRoom = (context: Store, payload: UpdateRoomPayload) => {
  context.commit({ key: 'clearRoom', payload: { index: payload.galera } });
};
