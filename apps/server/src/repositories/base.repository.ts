import { Redis } from 'ioredis';

export abstract class BaseRepository {
  constructor(protected redis: Redis) {}

  protected async getHashAll<T>(key: string): Promise<T | undefined> {
    const data = await this.redis.hgetall(key);
    return Object.keys(data).length > 0 ? (data as unknown as T) : undefined;
  }

  protected async setHash(key: string, data: Record<string, any>): Promise<void> {
    await this.redis.hset(key, data);
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
