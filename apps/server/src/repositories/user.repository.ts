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
    console.log('[UserRepository] Updating display name:', { userId, displayName });
    await this.setHash(`user:${userId}`, { displayName });
    const saved = await this.getHashField(`user:${userId}`, 'displayName');
    console.log('[UserRepository] Saved display name:', { userId, saved });
  }

  async getUserInfo(userId: string): Promise<UserData | undefined> {
    return this.getHashAll<UserData>(`user:${userId}`);
  }

  async getDisplayName(userId: string): Promise<string | undefined> {
    console.log('[UserRepository] Getting display name for:', userId);
    const displayName = await this.getHashField(`user:${userId}`, 'displayName');
    console.log('[UserRepository] Retrieved display name:', { userId, displayName });
    return displayName || undefined;
  }

  async getUserRooms(userId: string): Promise<string[]> {
    return this.getSetMembers(`user_rooms:${userId}`);
  }

  async addUserToRoom(userId: string, roomId: string): Promise<void> {
    await this.addToSet(`user_rooms:${userId}`, roomId);
  }
}
