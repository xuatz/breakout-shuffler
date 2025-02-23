export interface User {
  id: string;
  displayName: string;
  joinedAt: Date;
  health?: number;
  lastHealthCheck?: string;
}

export interface Room {
  id: string;
  hostId: string;
  createdAt: Date;
  users: User[];
  state: 'waiting' | 'active';
  groups?: { [groupId: string]: string[] };
}
