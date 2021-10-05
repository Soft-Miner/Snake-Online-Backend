import { LobbyOptions } from '@colyseus/core/build/rooms/LobbyRoom';
import { Client, LobbyRoom } from 'colyseus';
import { auth } from '../../utils/auth';
import { getRankingPosition } from './utils/getRankingPosition';
import { getTopRanking } from './utils/getTopRanking';

export class Lobby extends LobbyRoom {
  async onCreate(options: { token?: string }) {
    await super.onCreate(options);

    this.onMessage('message', (client, message: string) => {
      this.broadcast('message', {
        sender: client.userData.nickname,
        text: message,
      });
    });

    this.onMessage('ping', (client) => {
      client.send('pong');
    });

    this.onMessage('ranking:top', async (client) => {
      const topRanking = await getTopRanking();
      client.send('ranking:top', topRanking);
    });
  }

  onJoin(client: Client, options: LobbyOptions) {
    super.onJoin(client, options);

    getRankingPosition(client.userData.id).then((position) =>
      client.send('ranking:position', position)
    );

    this.broadcast('users-updated', this.clients.length);
  }

  onLeave(client: Client) {
    super.onLeave(client);

    this.broadcast('users-updated', this.clients.length);
  }

  async onAuth(client: Client, options: { token?: string }) {
    const { token } = options;
    if (!token) return false;

    const user = await auth(token);
    client.userData = user;

    return true;
  }
}
