import { Server } from 'socket.io';
import { getRepository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import User from '../../models/User';
import { randomDirection } from '../../utils/randomDirection';
import { randomElement } from '../../utils/randomElement';
import { randomIntBetween } from '../../utils/randomIntBetween';
import { shuffle } from '../../utils/shuffle';
import store from '../store';
import { Direction, Game as IGame, GameUser } from '../store/games/types';
import { Room, RoomUser } from '../store/rooms/types';
import { formatRoomsToHome } from '../store/rooms/utils/formatRoomsToHome';
import { NextPosition } from './types';

export const startGame = async (room: Room, io: Server) => {
  const game = new Game(room.id, [...room.users], room.mapSize, io);
  game.start();
};

class Game {
  private gameOver = false;
  private game: IGame;

  constructor(
    private roomId: string,
    users: RoomUser[],
    private mapSize: number,
    private io: Server
  ) {
    this.game = this.initialGame(users);
    store.dispatch({ type: 'newGame', payload: { game: this.game } });

    this.createRandomFruit();
  }

  private initialGame(users: RoomUser[]): IGame {
    const QUADRANTS_PER_LINE = 4;
    const quadrantSize = Math.floor(this.mapSize / QUADRANTS_PER_LINE);
    const quadrants = shuffle(
      Array.from(Array(QUADRANTS_PER_LINE * QUADRANTS_PER_LINE).keys())
    );

    return {
      id: uuid(),
      fruits: [],
      mapSize: this.mapSize,
      users: users.map((user, index) => {
        const quadrant = quadrants[index];
        const quadrantX = (quadrant % QUADRANTS_PER_LINE) * quadrantSize;
        const quadrantY =
          Math.floor(quadrant / QUADRANTS_PER_LINE) * quadrantSize;

        const headX = randomIntBetween(
          quadrantX + 1,
          quadrantX + quadrantSize - 2
        );
        const headY = randomIntBetween(
          quadrantY + 1,
          quadrantY + quadrantSize - 2
        );

        const bodyDirection = randomDirection();
        const bodyX = headX + bodyDirection.x;
        const bodyY = headY + bodyDirection.y;

        const direction = {
          x: -bodyDirection.x,
          y: -bodyDirection.y,
        } as Direction;

        return {
          body: [{ x: bodyX, y: bodyY }],
          lastDirections: [direction, direction],
          gamePoints: 1,
          head: { x: headX, y: headY },
          id: user.id,
        };
      }),
    };
  }

  private update() {
    this.updatePositions();
    this.updateGameStatus();
    this.sendUpdates();
  }

  private async updateGameStatus() {
    const usersAlive: GameUser[] = [];
    this.game.users.forEach((user) => {
      if (!this.dead(user)) {
        usersAlive.push(user);
      }
    });

    if (this.game.users.length > 1 && usersAlive.length < 2) {
      this.gameOver = true;
    } else if (this.game.users.length === 1 && usersAlive.length === 0) {
      this.gameOver = true;
    }
  }

  private async handleGameOver() {
    if (this.game.users.length > 1) {
      const winner = this.game.users.find((user) => !this.dead(user));
      if (winner) {
        winner.gamePoints += this.game.fruits.length;
      }

      const usersRepository = getRepository(User);
      const databaseUsers = await usersRepository
        .createQueryBuilder()
        .where('id IN(:...ids)', {
          ids: this.game.users.map((user) => user.id),
        })
        .getMany();
      databaseUsers.forEach((databaseUser) => {
        const gameUser = this.game.users.find(
          (user) => user.id === databaseUser.id
        );
        if (gameUser) {
          databaseUser.points += gameUser.gamePoints;
        }
      });
      usersRepository.save(databaseUsers);
    }

    const currentRoom = store.state.rooms.find(
      (room) => room.id === this.roomId
    );
    if (currentRoom) {
      currentRoom.playing = false;
      currentRoom.users.forEach((user) => {
        user.ready = false;
      });

      this.io.to(this.roomId).emit('room-user-changed', currentRoom);
      this.io
        .to('home')
        .emit('rooms-updated', formatRoomsToHome(store.state.rooms));
    }

    const gameIndex = store.state.games.findIndex(
      (game) => game.id === this.game.id
    );
    if (gameIndex !== -1) {
      store.state.games.splice(gameIndex, 1);
    }
  }

  private updatePositions() {
    const nextPositions = this.nextPositions();
    const playersToKill: GameUser[] = [];
    const playersToIncrement: GameUser[] = [];

    nextPositions.forEach((currentNextPosition) => {
      const player = this.game.users.find(
        (user) => user.id === currentNextPosition.userId
      );
      if (!player || this.dead(player)) return;

      // Collision with borders
      if (
        currentNextPosition.position.x >= this.mapSize ||
        currentNextPosition.position.x < 0 ||
        currentNextPosition.position.y < 0 ||
        currentNextPosition.position.y >= this.mapSize
      )
        return playersToKill.push(player);

      // Collision with nextPosition of another player
      for (let i = 0; i < nextPositions.length; i++) {
        const anotherPlayerNextPosition = nextPositions[i];
        if (anotherPlayerNextPosition.userId === player.id) continue;

        const collision =
          anotherPlayerNextPosition.position.x ===
            currentNextPosition.position.x &&
          anotherPlayerNextPosition.position.y ===
            currentNextPosition.position.y;

        if (collision) {
          return playersToKill.push(player);
        }
      }

      // Collision with body of some player
      for (let i = 0; i < this.game.users.length; i++) {
        const user = this.game.users[i];
        if (this.dead(user)) continue;

        for (let j = 0; j < user.body.length - 1; j++) {
          const bodyTile = user.body[j];

          const collisionWithBody =
            currentNextPosition.position.x === bodyTile.x &&
            currentNextPosition.position.y === bodyTile.y;

          if (collisionWithBody) {
            return playersToKill.push(player);
          }
        }

        const collisionWithHead =
          currentNextPosition.position.x === user.head.x &&
          currentNextPosition.position.y === user.head.y;

        if (collisionWithHead) {
          return playersToKill.push(player);
        }
      }

      // Collision with some fruit
      for (let i = this.game.fruits.length - 1; i >= 0; i--) {
        const fruit = this.game.fruits[i];
        const collisionWithFruit =
          fruit.x === currentNextPosition.position.x &&
          fruit.y === currentNextPosition.position.y;

        if (collisionWithFruit) {
          this.game.fruits.splice(i, 1);
          playersToIncrement.push(player);
        }
      }
    });

    playersToIncrement.forEach((playerToIncrement) => {
      playerToIncrement.body.push({ x: 0, y: 0 });
      playerToIncrement.gamePoints++;
    });

    nextPositions.forEach((currentNextPosition) => {
      const player = this.game.users.find(
        (user) => user.id === currentNextPosition.userId
      );
      if (!player || this.dead(player)) return;

      player.body.splice(0, 0, { x: player.head.x, y: player.head.y });
      player.body.pop();
      player.head.x = currentNextPosition.position.x;
      player.head.y = currentNextPosition.position.y;
    });
    playersToKill.forEach((playerToKill) => this.kill(playerToKill));

    if (this.game.fruits.length === 0) {
      this.createRandomFruit();
    }
  }

  private kill(player: GameUser) {
    player.body.forEach((bodyTile) => {
      this.game.fruits.push({ x: bodyTile.x, y: bodyTile.y });
    });
    player.body = [];
  }

  private dead(player: GameUser) {
    return player.body.length === 0;
  }

  private nextPositions() {
    const nextPositions: NextPosition[] = [];

    this.game.users.forEach((user) => {
      if (!this.dead(user)) {
        const snakeDirection = {
          x: user.head.x - user.body[0].x,
          y: user.head.y - user.body[0].y,
        };

        const primaryDirection =
          user.lastDirections[user.lastDirections.length - 1];
        const secondaryDirection =
          user.lastDirections[user.lastDirections.length - 2];
        if (
          primaryDirection.x !== -snakeDirection.x ||
          primaryDirection.y !== -snakeDirection.y
        ) {
          snakeDirection.x = primaryDirection.x;
          snakeDirection.y = primaryDirection.y;
        } else if (
          secondaryDirection.x !== -snakeDirection.x ||
          secondaryDirection.y !== -snakeDirection.y
        ) {
          snakeDirection.x = secondaryDirection.x;
          snakeDirection.y = secondaryDirection.y;
        }

        nextPositions.push({
          userId: user.id,
          position: {
            x: user.head.x + snakeDirection.x,
            y: user.head.y + snakeDirection.y,
          },
        });
      }
    });

    return nextPositions;
  }

  private createRandomFruit() {
    const allTiles: Record<number, Record<number, boolean>> = {};
    for (let x = 0; x < this.mapSize; x++) {
      for (let y = 0; y < this.mapSize; y++) {
        if (allTiles[x]) {
          allTiles[x][y] = true;
        } else {
          allTiles[x] = { [y]: true };
        }
      }
    }

    this.game.users.forEach((user) => {
      user.body.forEach(({ x, y }) => {
        delete allTiles[x][y];
      });

      delete allTiles[user.head.x][user.head.y];
    });
    this.game.fruits.forEach((fruit) => {
      delete allTiles[fruit.x][fruit.y];
    });

    const availableTiles: Array<{ x: number; y: number }> = [];
    Object.keys(allTiles).forEach((x) => {
      Object.keys(allTiles[Number(x)]).forEach((y) => {
        availableTiles.push({ x: Number(x), y: Number(y) });
      });
    });

    if (availableTiles.length > 0) {
      const fruit = randomElement(availableTiles);

      this.game.fruits.push(fruit);
    }
  }

  start() {
    this.io.to(this.roomId).emit('game-started', this.game);

    const tick = () => {
      this.update();

      if (!this.gameOver) {
        setTimeout(tick, 150);
      } else {
        this.handleGameOver();
      }
    };

    setTimeout(() => {
      tick();
    }, 3000);
  }

  private sendUpdates() {
    this.io.to(this.roomId).emit('game-update', this.game);
  }
}
