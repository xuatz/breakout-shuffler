import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

interface User {
  id: string;
  displayName?: string;
}

export interface Room {
  id: string;
  hostId: string;
  createdAt: Date;
}

export class RoomService {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async getRooms() {
    const keys = await this.redis.keys('room:*');
    const rooms = [];

    for (const key of keys) {
      const roomData = await this.redis.hgetall(key);
      rooms.push({ id: key.replace('room:', ''), ...roomData });
    }

    return rooms;
  }

  async createRoom(hostId: string): Promise<Room> {
    const existingRooms = await this.redis.smembers(`host_rooms:${hostId}`);
    if (existingRooms.length > 0) {
      throw new Error(`Host ${hostId} already has a room: ${existingRooms[0]}`);
    }

    /**
     * TODO maybe the host can decide on roomId in future
     * as long as we include uniq check
     */
    const roomId = uuidv4();
    const room: Room = {
      id: roomId,
      hostId,
      createdAt: new Date(),
    };

    await Promise.all([
      this.redis.hset(`room:${roomId}`, room),
      this.redis.sadd(`participants:${roomId}`, hostId),
      this.redis.sadd(`host_rooms:${hostId}`, roomId),
      this.redis.sadd(`user_rooms:${hostId}`, roomId),
    ]);

    const rooms = await this.getRooms();

    return room;
  }

  async getRoomByHost(hostId: string): Promise<Room | undefined> {
    const roomIds = await this.redis.smembers(`host_rooms:${hostId}`);

    if (roomIds.length === 0) {
      // Host has no active room
      return;
    }

    const roomId = roomIds[0]; // Since host can only have ONE room
    const roomData = (await this.redis.hgetall(
      `room:${roomId}`
    )) as unknown as Room;

    if (!roomData || Object.keys(roomData).length === 0) {
      return; // Room might have been deleted
    }

    return {
      ...roomData,
      id: roomId,
    };
  }

  async roomExists(roomId: string): Promise<boolean> {
    const room = await this.getRoom(roomId);
    return !!room;
  }

  async getRoom(roomId: string): Promise<Room | undefined> {
    const room = (await this.redis.hgetall(
      `room:${roomId}`
    )) as unknown as Room;

    return Object.keys(room).length > 0 ? room : undefined;
  }

  async joinRoom(
    roomId: string,
    userId: string,
    displayName: string
  ): Promise<boolean> {
    const room = await this.getRoom(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    await Promise.all([
      this.redis.sadd(`participants:${roomId}`, userId),
      this.redis.sadd(`user_rooms:${userId}`, roomId),
      this.redis.hset(`user:${userId}`, {
        displayName,
      }),
    ]);

    return true;
  }

  async getParticipants(roomId: string): Promise<User[]> {
    const participantIds = await this.redis.smembers(`participants:${roomId}`);
    
    const participants = await Promise.all(
      participantIds.map(async (id) => {
        const userData = await this.redis.hgetall(`user:${id}`);
        return {
          id,
          displayName: userData.displayName,
        };
      })
    );
    return participants;
  }

  async getRoomByParticipant(userId: string): Promise<Room | undefined> {
    const rooms = await this.redis.smembers(`user_rooms:${userId}`);
    if (rooms.length === 0) {
      return undefined;
    }

    return this.getRoom(rooms[0]);
  }
}
