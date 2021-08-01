export interface Game {
  id: string;
  mapSize: number;
  users: GameUser[];
  fruits: Array<{
    x: number;
    y: number;
  }>;
}

export interface GameUser {
  id: string;
  gamePoints: number;
  body: Array<{
    x: number;
    y: number;
  }>;
  head: {
    x: number;
    y: number;
  };
  direction: Direction;
}

export type Direction = Up | Down | Left | Right;

type Up = { x: 0; y: -1 };
type Down = { x: 0; y: 1 };
type Left = { x: -1; y: 0 };
type Right = { x: 1; y: 0 };
