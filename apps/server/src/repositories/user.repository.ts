import { Redis } from 'ioredis';
import { BaseRepository } from './base.repository';

export interface UserData {
  displayName?: string;
  health?: number;
  lastHealthCheck?: string;
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

  async updateHealth(userId: string): Promise<{ health?: number; lastHealthCheck?: string }> {
    const now = new Date().toISOString();

    const healthInfo = {
      health: 100, // Reset to full health on health check
      lastHealthCheck: now,
    }

    await this.setHash(`user:${userId}`, healthInfo);

    return healthInfo;
  }

  async getHealth(userId: string): Promise<{ health?: number; lastHealthCheck?: string }> {
    const health = await this.getHashField(`user:${userId}`, 'health');
    const lastHealthCheck = await this.getHashField(`user:${userId}`, 'lastHealthCheck');
    return {
      health: health ? parseInt(health) : undefined,
      lastHealthCheck: lastHealthCheck || undefined,
    };
  }

  async calculateCurrentHealth(userId: string): Promise<number> {
    const { lastHealthCheck } = await this.getHealth(userId);
    if (!lastHealthCheck) return 0;

    const now = new Date();
    const lastCheck = new Date(lastHealthCheck);
    const minutesSinceLastCheck = (now.getTime() - lastCheck.getTime()) / (1000 * 60);

    if (minutesSinceLastCheck <= 1) return 100;
    if (minutesSinceLastCheck <= 2) return 70;
    return 30;
  }
}
