import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

interface User {
  id: string;
  name: string;
  joinedAt: Date;
}

export interface Room {
  id: string;
  hostId: string;
  createdAt: Date;
  users: User[];
}

export class RoomService {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async createRoom(): Promise<{ roomId: string; hostId: string }> {
    const roomId = uuidv4();
    const hostId = uuidv4();
    const room: Room = {
      id: roomId,
      hostId,
      createdAt: new Date(),
      users: [
        {
          id: hostId,
          name: this.generateRandomName(),
          joinedAt: new Date(),
        },
      ],
    };

    await this.redis.set(`room:${roomId}`, JSON.stringify(room));
    return { roomId, hostId };
  }

  async getRoom(roomId: string): Promise<Room | null> {
    const room = await this.redis.get(`room:${roomId}`);
    return room ? JSON.parse(room) : null;
  }

  async joinRoom(
    roomId: string
  ): Promise<{ userId: string; userName: string }> {
    const room = await this.getRoom(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const userId = uuidv4();
    const userName = this.generateRandomName();

    room.users.push({
      id: userId,
      name: userName,
      joinedAt: new Date(),
    });

    await this.redis.set(`room:${roomId}`, JSON.stringify(room));
    return { userId, userName };
  }

  private generateRandomName(): string {
    const adjectives = ['Happy', 'Silly', 'Clever', 'Brave', 'Gentle'];
    const nouns = ['Penguin', 'Lion', 'Tiger', 'Bear', 'Owl'];
    const randomAdjective =
      adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${randomAdjective} ${randomNoun}`;
  }
}
