import { Redis } from 'ioredis';
import { BaseRepository } from './base.repository';

export interface UserData {
  displayName?: string;
}

export class UserRepository extends BaseRepository {
  constructor(redis: Redis) {
    super(redis);
  }

  async updateDisplayName(userId: string, displayName: string): Promise<void> {
    await this.setHash(`user:${userId}`, { displayName });
  }

  async getUserInfo(userId: string): Promise<UserData | undefined> {
    return this.getHashAll<UserData>(`user:${userId}`);
  }

  async getUserRooms(userId: string): Promise<string[]> {
    return this.getSetMembers(`user_rooms:${userId}`);
  }

  async addUserToRoom(userId: string, roomId: string): Promise<void> {
    await this.addToSet(`user_rooms:${userId}`, roomId);
  }
}
