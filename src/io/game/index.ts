import { Server } from 'socket.io';
import { v4 as uuid } from 'uuid';
import { randomDirection } from '../../utils/randomDirection';
import { randomElement } from '../../utils/randomElement';
import { randomIntBetween } from '../../utils/randomIntBetween';
import { shuffle } from '../../utils/shuffle';
import store from '../store';
import { Direction, Game as IGame, GameUser } from '../store/games/types';
import { Room, RoomUser } from '../store/rooms/types';
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
          direction,
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

  private updateGameStatus() {
    let usersAlive = 0;
    this.game.users.forEach((user) => {
      if (!this.dead(user)) {
        usersAlive++;
      }
    });

    if (usersAlive === 0) {
      this.gameOver = true;
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

        for (let j = 0; j < user.body.length; j++) {
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

    playersToIncrement.forEach((playerToIncrement) =>
      playerToIncrement.body.push({ x: 0, y: 0 })
    );

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
        nextPositions.push({
          userId: user.id,
          position: {
            x: user.head.x + user.direction.x,
            y: user.head.y + user.direction.y,
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

    const fruit = randomElement(availableTiles);

    this.game.fruits.push(fruit);
  }

  start() {
    console.log('New Game Started', this.game.id);
    this.io.to(this.roomId).emit('game-started', this.game);

    const tick = () => {
      this.update();

      if (!this.gameOver) {
        setTimeout(tick, 150);
      } else {
        console.log('Game Over', this.game.id);
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
