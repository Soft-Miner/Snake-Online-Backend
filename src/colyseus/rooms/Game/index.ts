import { Client, Room, updateLobby } from 'colyseus';
import User from '../../../models/User';
import { LeaveCode } from '../../types';
import { auth } from '../../utils/auth';
import { Game } from './Game';
import { GameState, Player } from './schema';

interface Options {
  name?: string;
  token?: string;
}

export class GameRoom extends Room<GameState> {
  onCreate(options: Options) {
    if (!options.name) return;

    this.onMessage('message', (client, message: string) => {
      this.broadcast('message', {
        sender: client.userData.nickname,
        text: message,
      });
    });

    this.onMessage('kick', (client, id) => {
      const playerToKick = this.clients.find(
        (player) => player.userData.id === id
      );

      if (playerToKick) playerToKick.leave(LeaveCode.KICKED);
    });

    this.onMessage('update-config', (client, config?: { size: number }) => {
      const size = config?.size;
      const player = this.state.players.find(
        (item) => item.id === client.userData.id
      );

      if (size && player && player.owner) {
        this.state.mapSize = size;
        this.setMetadata({ ...this.metadata, mapSize: this.state.mapSize });
      }
    });

    this.onMessage('change-direction', (client, direction: number) => {
      console.log('change-direction');
      const player = this.state.players.find(
        (item) => item.id === client.userData.id
      );
      if (!player) return;

      switch (direction) {
        case 1: {
          console.log('up');
          player.lastDirections.splice(0, 1);
          player.lastDirections.push({ x: 0, y: -1 });
          break;
        }
        case 2: {
          console.log('right');
          player.lastDirections.splice(0, 1);
          player.lastDirections.push({ x: 1, y: 0 });
          break;
        }
        case 3: {
          console.log('down');
          player.lastDirections.splice(0, 1);
          player.lastDirections.push({ x: 0, y: 1 });
          break;
        }
        case 4: {
          console.log('left');
          player.lastDirections.splice(0, 1);
          player.lastDirections.push({ x: -1, y: 0 });
          break;
        }
      }
    });

    this.onMessage('update-ready', (client, ready: boolean) => {
      const player = this.state.players.find(
        (item) => item.id === client.userData.id
      );

      if (!player) return;

      if (!player.owner) {
        player.ready = ready;
      } else {
        const allPlayersAreReady =
          this.state.players.filter((item) => !item.ready && !item.owner)
            .length === 0;

        if (allPlayersAreReady) {
          const game = new Game(this);
          game.start();
        }
      }
    });

    this.onMessage('close-slot', (client, index: number) => {
      const slot = this.state.slots[index];
      const player = this.state.players.find(
        (item) => item.id === client.userData.id
      );
      if (!player || !slot) return;

      if (player.owner && !slot.player) {
        slot.open = false;
      }

      const openSlots = this.state.slots.filter((slot) => slot.open).length;
      this.maxClients = openSlots;
      this.setMetadata({ ...this.metadata, maxClients: this.maxClients }).then(
        () => updateLobby(this)
      );
    });

    this.onMessage('open-slot', (client, index: number) => {
      const slot = this.state.slots[index];
      const player = this.state.players.find(
        (item) => item.id === client.userData.id
      );
      if (!player || !slot) return;

      if (player.owner && !slot.player) {
        slot.open = true;
      }

      const openSlots = this.state.slots.filter((slot) => slot.open).length;
      this.maxClients = openSlots;
      this.setMetadata({ ...this.metadata, maxClients: this.maxClients }).then(
        () => updateLobby(this)
      );
    });

    this.onMessage('ping', (client) => {
      client.send('pong');
    });

    this.setState(new GameState());
    this.setMetadata({
      name: options.name,
      playing: false,
      mapSize: this.state.mapSize,
      maxClients: this.maxClients,
    });

    const openSlots = this.state.slots.filter((slot) => slot.open).length;

    this.maxClients = openSlots;
    this.setMetadata({ ...this.metadata, maxClients: this.maxClients });
    this.state.roomName = this.metadata.name;
  }

  async onAuth(client: Client, options: Options) {
    const { token, name } = options;
    if (!token || (!this.metadata.name && !name)) return false;

    const user = await auth(token);
    client.userData = user;

    return true;
  }

  onJoin(client: Client) {
    const clientUserData = client.userData as User;
    const newPlayer = new Player();
    newPlayer.id = clientUserData.id;
    newPlayer.name = clientUserData.nickname;
    newPlayer.owner = this.clients.length === 1 ? true : false;
    newPlayer.gamePoints = 0;
    newPlayer.ready = false;

    const emptySlot = this.state.slots.find(
      (slot) => !slot.player && slot.open
    );

    if (!emptySlot) {
      return client.leave();
    }

    emptySlot.player = newPlayer;
    this.state.players.push(newPlayer);
  }

  onLeave(client: Client) {
    const playerIndex = this.state.players.findIndex(
      (player) => player.id === client.userData.id
    );
    const slotIndex = this.state.slots.findIndex(
      (slot) => slot.player?.id === client.userData.id
    );
    const playerWasOwner = this.state.players[playerIndex].owner;

    this.state.slots[slotIndex].player = undefined;
    this.state.slots[slotIndex].open = true;
    this.state.players.splice(playerIndex, 1);

    if (playerWasOwner && this.state.players.length > 0)
      this.state.players[0].owner = true;
  }

  onDispose() {
    // console.log('onDispose');
  }
}
