export interface Room {
  id: string;
  name: string;
  owner: string;
  users: Array<{
    id: string;
    nickname: string;
    email: string;
    points: number;
    ready: boolean;
  }>;
  slots: string[] /* 'closed' | 'open' | userId */;
  mapSize: number;
  game: {
    roomId: string;
    id: string;
    users: Array<{
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
      direction: 'up' | 'down' | 'left' | 'right';
    }>;
    fruits: Array<{
      x: number;
      y: number;
    }>;
  } | null;
}
