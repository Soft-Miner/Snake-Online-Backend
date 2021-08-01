export interface Room {
  id: string;
  name: string;
  owner: string;
  users: RoomUser[];
  slots: string[] /* 'closed' | 'open' | userId */;
  mapSize: number;
  playing: boolean;
}

export interface RoomUser {
  id: string;
  nickname: string;
  email: string;
  points: number;
  ready: boolean;
}
