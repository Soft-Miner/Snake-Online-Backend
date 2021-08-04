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
  lastDirections: Direction[];
}

export const directions: Record<number, Direction> = {
  1: { x: 0, y: -1 },
  2: { x: 1, y: 0 },
  3: { x: 0, y: 1 },
  4: { x: -1, y: 0 },
};

export type Direction = Up | Down | Left | Right;

type Up = { x: 0; y: -1 };
type Down = { x: 0; y: 1 };
type Left = { x: -1; y: 0 };
type Right = { x: 1; y: 0 };
