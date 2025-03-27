import { Redis } from 'ioredis';
import { BaseRepository } from './base.repository';

export interface UserData {
  displayName?: string;
  lastLivelinessUpdateAt?: string;
}

export class UserRepository extends BaseRepository {
  constructor(redis: Redis) {
    super(redis);
  }

  async updateDisplayName(userId: string, displayName: string): Promise<void> {
    console.log('[UserRepository] Updating display name:', {
      userId,
      displayName,
    });
    await this.setHash(`user:${userId}`, { displayName });
    const saved = await this.getHashField(`user:${userId}`, 'displayName');
    console.log('[UserRepository] Saved display name:', { userId, saved });
  }

  async getUserInfo(userId: string): Promise<UserData | undefined> {
    return this.getHashAll<UserData>(`user:${userId}`);
  }

  async getDisplayName(userId: string): Promise<string | undefined> {
    console.log('[UserRepository] Getting display name for:', userId);
    const displayName = await this.getHashField(
      `user:${userId}`,
      'displayName'
    );
    console.log('[UserRepository] Retrieved display name:', {
      userId,
      displayName,
    });
    return displayName || undefined;
  }

  async getUserRooms(userId: string): Promise<string[]> {
    return this.getSetMembers(`user_rooms:${userId}`);
  }

  async addUserToRoom(userId: string, roomId: string): Promise<void> {
    await this.addToSet(`user_rooms:${userId}`, roomId);
  }

  async removeUserFromRoom(userId: string, roomId: string): Promise<void> {
    await this.removeFromSet(`user_rooms:${userId}`, roomId);
  }

  // --- Liveliness Tracking ---

  async updateLiveliness(userId: string): Promise<void> {
    const timestamp = new Date().toISOString();
    await this.setHash(`user:${userId}`, { lastLivelinessUpdateAt: timestamp });
  }

  async getLiveliness(userId: string): Promise<string | undefined> {
    const timestamp = await this.getHashField(
      `user:${userId}`,
      'lastLivelinessUpdateAt'
    );
    return timestamp || undefined;
  }
}
