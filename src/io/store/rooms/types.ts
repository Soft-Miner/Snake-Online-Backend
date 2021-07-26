export interface Room {
  id: string;
  name: string;
  // 'open' | 'closed' | userId
  users: string[];
}
