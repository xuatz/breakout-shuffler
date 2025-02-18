import { Redis } from 'ioredis';

export abstract class BaseRepository {
  constructor(protected redis: Redis) {}

  protected async getHashAll<T>(key: string): Promise<T | undefined> {
    const data = await this.redis.hgetall(key);
    return Object.keys(data).length > 0 ? (data as T) : undefined;
  }

  protected async getHashField(key: string, field: string): Promise<string | null> {
    return this.redis.hget(key, field);
  }

  protected async setHash(key: string, data: Record<string, any>): Promise<void> {
    const entries = Object.entries(data).map(([field, value]) => [field, String(value)]);
    if (entries.length > 0) {
      await this.redis.hset(key, ...entries.flat());
    }
  }

  protected async addToSet(key: string, member: string): Promise<void> {
    await this.redis.sadd(key, member);
  }

  protected async getSetMembers(key: string): Promise<string[]> {
    return this.redis.smembers(key);
  }

  protected async deleteKey(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
