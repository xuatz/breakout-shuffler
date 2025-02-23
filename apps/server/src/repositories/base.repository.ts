import { Redis } from 'ioredis';

export abstract class BaseRepository {
  constructor(protected redis: Redis) {}

  protected async getHashAll<T>(key: string): Promise<T | undefined> {
    const data = await this.redis.hgetall(key);
    if (Object.keys(data).length === 0) return undefined;

    // Parse any JSON string values
    const parsedData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => {
        if (typeof value === 'string') {
          try {
            // Try to parse the value as JSON
            const parsed = JSON.parse(value);
            // Additional check to ensure objects are properly parsed
            if (parsed && typeof parsed === 'object') {
              return [key, parsed];
            }
          } catch {}
        }
        return [key, value];
      })
    );

    return parsedData as T;
  }

  protected async getHashField(
    key: string,
    field: string
  ): Promise<string | null> {
    return this.redis.hget(key, field);
  }

  protected async setHash(
    key: string,
    data: Record<string, any>
  ): Promise<void> {
    const entries = Object.entries(data).map(([field, value]) => [
      field,
      typeof value === 'object' ? JSON.stringify(value) : String(value),
    ]);
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

  protected async removeFromSet(key: string, member: string): Promise<void> {
    await this.redis.srem(key, member);
  }
}
