export interface User {
  id: string;
  displayName: string;
  joinedAt: Date;
}

export interface Room {
  id: string;
  hostId: string;
  createdAt: Date;
  users: User[];
}
