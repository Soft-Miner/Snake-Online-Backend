import { Server, Socket } from 'socket.io';
import store from '../../store';

interface UpdateConfigPayload {
  size: number;
}
export const updateConfig = (socket: Socket, io: Server) => {
  return (config: UpdateConfigPayload) => {
    store.dispatch({ type: 'updateConfig', payload: { socket, io, config } });
  };
};
