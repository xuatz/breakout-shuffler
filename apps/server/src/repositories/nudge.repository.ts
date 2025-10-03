import { Redis } from 'ioredis';
import { BaseRepository } from './base.repository';

export interface NudgeData {
  userId: string;
  displayName: string;
  count: number;
  lastNudge: Date;
}

export class NudgeRepository extends BaseRepository {
  constructor(redis: Redis) {
    super(redis);
  }

  private getKey(roomId: string): string {
    return `host_nudges:${roomId}`;
  }

  async getNudges(roomId: string): Promise<NudgeData[]> {
    const key = this.getKey(roomId);
    const allNudges = await this.redis.hgetall(key);
    return Object.values(allNudges).map((data) => JSON.parse(data));
  }

  async getNudgeForUser(
    roomId: string,
    userId: string,
  ): Promise<NudgeData | undefined> {
    const key = this.getKey(roomId);
    const nudgeData = await this.redis.hget(key, userId);
    return nudgeData ? JSON.parse(nudgeData) : undefined;
  }

  async updateNudge(
    roomId: string,
    userId: string,
    displayName: string,
  ): Promise<void> {
    const key = this.getKey(roomId);
    const existingData = await this.getNudgeForUser(roomId, userId);

    const nudgeData: NudgeData = existingData
      ? {
          ...existingData,
          count: existingData.count + 1,
          lastNudge: new Date(),
        }
      : {
          userId,
          displayName,
          count: 1,
          lastNudge: new Date(),
        };

    await this.redis.hset(key, userId, JSON.stringify(nudgeData));
  }

  async clearNudges(roomId: string): Promise<void> {
    await this.deleteKey(this.getKey(roomId));
  }
}
