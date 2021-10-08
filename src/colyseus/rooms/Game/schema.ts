import { ArraySchema, Schema, type } from '@colyseus/schema';

export enum Direction {
  Up,
  Down,
  Left,
  Right,
}

export class Position extends Schema {
  @type('uint8') x: number;
  @type('uint8') y: number;

  constructor(x: number, y: number) {
    super();
    this.x = x;
    this.y = y;
  }
}

export class Player extends Schema {
  @type('string') id: string;
  @type('string') name: string;

  @type(Position) head = new Position(0, 0);
  @type([Position]) body = new ArraySchema<Position>();

  @type('boolean') owner: boolean;

  @type('uint8') gamePoints: number;

  @type('boolean') ready: boolean;

  lastDirections: Array<{ x: number; y: number }> = [];
}

export class Slot extends Schema {
  @type('boolean') open: boolean;
  @type(Player) player?: Player;
}

export class GameState extends Schema {
  @type([Player]) players = new ArraySchema<Player>();
  @type([Position]) fruits = new ArraySchema<Position>();

  @type('uint8') mapSize: number;

  @type([Slot]) slots = new ArraySchema<Slot>();
  @type('boolean') playing: boolean;

  @type('string') roomName: string;

  constructor() {
    super();

    this.mapSize = 12;
    this.playing = false;

    for (let i = 0; i < 12; i++) {
      if (i < 4) {
        const newSlot = new Slot();
        newSlot.open = true;
        this.slots.push(newSlot);
      } else {
        const newSlot = new Slot();
        newSlot.open = false;
        this.slots.push(newSlot);
      }
    }
  }
}
