import { Room, updateLobby } from '@colyseus/core';
import { ArraySchema } from '@colyseus/schema';
import { randomDirection } from '../../../../utils/randomDirection';
import { randomElement } from '../../../../utils/randomElement';
import { randomIntBetween } from '../../../../utils/randomIntBetween';
import { shuffle } from '../../../../utils/shuffle';
import { GameState, Player, Position } from '../schema';
import { NextPosition } from './types';
import { givePoints } from './utils/givePoints';

export class Game {
  private gameOver = false;

  constructor(private room: Room<GameState>) {
    this.initialGame();
    this.createRandomFruit();
  }

  private initialGame() {
    this.room.state.fruits = new ArraySchema();
    const QUADRANTS_PER_LINE = 4;
    const quadrantSize = Math.floor(
      this.room.state.mapSize / QUADRANTS_PER_LINE
    );
    const quadrants = shuffle(
      Array.from(Array(QUADRANTS_PER_LINE * QUADRANTS_PER_LINE).keys())
    );

    this.room.state.players.forEach((player, index) => {
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
      };

      player.lastDirections.push(direction, direction);
      player.head.x = headX;
      player.head.y = headY;
      player.body = new ArraySchema(new Position(bodyX, bodyY));
      player.gamePoints = 1;
    });
  }

  private update() {
    this.updatePositions();
    this.updateGameStatus();
  }

  private async updateGameStatus() {
    const usersAlive: number = this.room.state.players.filter(
      (player) => !this.dead(player)
    ).length;

    if (this.room.state.players.length > 1 && usersAlive < 2) {
      this.gameOver = true;
    } else if (this.room.state.players.length === 1 && usersAlive === 0) {
      this.gameOver = true;
    }
  }

  private async handleGameOver() {
    if (this.room.state.players.length > 1) {
      const winner = this.room.state.players.find(
        (player) => !this.dead(player)
      );
      if (winner) {
        winner.gamePoints += this.room.state.fruits.length;
        givePoints(winner.id, winner.gamePoints);
      }
    }

    this.room.state.players.forEach((player) => {
      player.ready = false;
    });
    this.room.state.playing = false;
    this.room
      .setMetadata({ ...this.room.metadata, playing: false })
      .then(() => updateLobby(this.room));
  }

  private updatePositions() {
    const nextPositions = this.nextPositions();
    const playersToKill: Player[] = [];
    const playersToIncrement: Player[] = [];

    nextPositions.forEach((currentNextPosition) => {
      const player = this.room.state.players.find(
        (item) => item.id === currentNextPosition.userId
      );
      if (!player || this.dead(player)) return;

      // Collision with borders
      if (
        currentNextPosition.position.x >= this.room.state.mapSize ||
        currentNextPosition.position.x < 0 ||
        currentNextPosition.position.y < 0 ||
        currentNextPosition.position.y >= this.room.state.mapSize
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
      for (let i = 0; i < this.room.state.players.length; i++) {
        const user = this.room.state.players[i];
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
      for (let i = this.room.state.fruits.length - 1; i >= 0; i--) {
        const fruit = this.room.state.fruits[i];
        const collisionWithFruit =
          fruit.x === currentNextPosition.position.x &&
          fruit.y === currentNextPosition.position.y;

        if (collisionWithFruit) {
          this.room.state.fruits.splice(i, 1);
          playersToIncrement.push(player);
        }
      }
    });

    playersToIncrement.forEach((playerToIncrement) => {
      playerToIncrement.body.push(new Position(0, 0));
      playerToIncrement.gamePoints++;
    });

    nextPositions.forEach((currentNextPosition) => {
      const player = this.room.state.players.find(
        (user) => user.id === currentNextPosition.userId
      );
      if (!player || this.dead(player)) return;

      player.body.unshift(new Position(player.head.x, player.head.y));
      player.body.pop();
      player.head.x = currentNextPosition.position.x;
      player.head.y = currentNextPosition.position.y;
    });
    playersToKill.forEach((playerToKill) => this.kill(playerToKill));

    if (this.room.state.fruits.length === 0) {
      this.createRandomFruit();
    }
  }

  private kill(player: Player) {
    player.body.forEach((bodyTile) => {
      this.room.state.fruits.push(new Position(bodyTile.x, bodyTile.y));
    });
    player.body = new ArraySchema<Position>();

    if (this.room.state.players.length > 1) {
      givePoints(player.id, player.gamePoints);
    }
  }

  private dead(player: Player) {
    return player.body.length === 0;
  }

  private nextPositions() {
    const nextPositions: NextPosition[] = [];

    this.room.state.players.forEach((player) => {
      if (!this.dead(player)) {
        const snakeDirection = {
          x: player.head.x - player.body[0].x,
          y: player.head.y - player.body[0].y,
        };

        const primaryDirection =
          player.lastDirections[player.lastDirections.length - 1];
        const secondaryDirection =
          player.lastDirections[player.lastDirections.length - 2];
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
          userId: player.id,
          position: {
            x: player.head.x + snakeDirection.x,
            y: player.head.y + snakeDirection.y,
          },
        });
      }
    });

    return nextPositions;
  }

  private createRandomFruit() {
    const allTiles: Record<number, Record<number, boolean>> = {};
    for (let x = 0; x < this.room.state.mapSize; x++) {
      for (let y = 0; y < this.room.state.mapSize; y++) {
        if (allTiles[x]) {
          allTiles[x][y] = true;
        } else {
          allTiles[x] = { [y]: true };
        }
      }
    }

    this.room.state.players.forEach((player) => {
      player.body.forEach(({ x, y }) => {
        delete allTiles[x][y];
      });

      delete allTiles[player.head.x][player.head.y];
    });
    this.room.state.fruits.forEach((fruit) => {
      delete allTiles[fruit.x][fruit.y];
    });

    const availableTiles: Array<{ x: number; y: number }> = [];
    Object.keys(allTiles).forEach((x) => {
      Object.keys(allTiles[Number(x)]).forEach((y) => {
        availableTiles.push({ x: Number(x), y: Number(y) });
      });
    });

    if (availableTiles.length > 0) {
      const randomPosition = randomElement(availableTiles);

      this.room.state.fruits.push(
        new Position(randomPosition.x, randomPosition.y)
      );
    }
  }

  start() {
    this.room.state.playing = true;
    this.room
      .setMetadata({ ...this.room.metadata, playing: true })
      .then(() => updateLobby(this.room));

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
}
