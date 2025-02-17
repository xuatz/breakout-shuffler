import { Redis } from 'ioredis';
import { BaseRepository } from './base.repository';
import { Room } from '../services/room.service';

export class RoomRepository extends BaseRepository {
  constructor(redis: Redis) {
    super(redis);
  }

  async createRoom(room: Room): Promise<void> {
    await Promise.all([
      this.setHash(`room:${room.id}`, room),
      this.addToSet(`participants:${room.id}`, room.hostId),
      this.addToSet(`host_rooms:${room.hostId}`, room.id),
      this.addToSet(`user_rooms:${room.hostId}`, room.id),
    ]);
  }

  async getRoom(roomId: string): Promise<Room | undefined> {
    return this.getHashAll<Room>(`room:${roomId}`);
  }

  async getRoomByHost(hostId: string): Promise<Room | undefined> {
    const roomIds = await this.getSetMembers(`host_rooms:${hostId}`);
    if (roomIds.length === 0) {
      return undefined;
    }

    const roomId = roomIds[0]; // Host can only have one room
    const room = await this.getRoom(roomId);
    
    if (!room) {
      return undefined;
    }

    return {
      ...room,
      id: roomId,
    };
  }

  async getAllRooms(): Promise<Room[]> {
    const keys = await this.redis.keys('room:*');
    const rooms = [];

    for (const key of keys) {
      const roomData = await this.getHashAll<Room>(key);
      if (roomData) {
        rooms.push({ 
          ...roomData,
          id: key.replace('room:', '')
        });
      }
    }

    return rooms;
  }

  async addParticipant(roomId: string, userId: string): Promise<void> {
    await this.addToSet(`participants:${roomId}`, userId);
  }

  async getParticipants(roomId: string): Promise<string[]> {
    return this.getSetMembers(`participants:${roomId}`);
  }

  async exists(roomId: string): Promise<boolean> {
    const room = await this.getRoom(roomId);
    return !!room;
  }
}
