import { Redis } from 'ioredis';
import { BaseRepository } from './base.repository';
import { Room } from '../services/room.service';

export class RoomRepository extends BaseRepository {
  constructor(redis: Redis) {
    super(redis);
  }

  async createRoom(room: Room): Promise<void> {
    await Promise.all([
      this.setHash(`room:${room.id}`, {
        hostId: room.hostId,
        createdAt: room.createdAt.toISOString(),
        state: room.state,
      }),
      this.addToSet(`participants:${room.id}`, room.hostId),
      this.addToSet(`host_rooms:${room.hostId}`, room.id),
      this.addToSet(`user_rooms:${room.hostId}`, room.id),
    ]);
  }

  async getRoom(roomId: string): Promise<Room | undefined> {
    const roomData = await this.getHashAll<{
      hostId: string;
      createdAt: string;
      state: 'waiting' | 'active';
    }>(`room:${roomId}`);

    if (!roomData) return undefined;

    const groups = await this.getGroups(roomId);

    return {
      id: roomId,
      hostId: roomData.hostId,
      createdAt: new Date(roomData.createdAt),
      state: roomData.state,
      ...(groups && { groups }),
    };
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
          id: key.replace('room:', ''),
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

  async removeParticipant(roomId: string, userId: string): Promise<void> {
    await this.removeFromSet(`participants:${roomId}`, userId);
  }

  async exists(roomId: string): Promise<boolean> {
    const room = await this.getRoom(roomId);
    return !!room;
  }

  async updateRoom(roomId: string, room: Room): Promise<void> {
    const { hostId, createdAt, state, groups } = room;

    await this.setHash(`room:${roomId}`, {
      hostId,
      createdAt: createdAt.toISOString(),
      state,
    });

    if (groups) {
      await this.setGroups(roomId, groups);
    } else {
      // If groups is undefined, clear any existing groups
      await this.clearGroups(roomId);
    }
  }

  private async getGroups(
    roomId: string
  ): Promise<{ [groupId: string]: string[] } | undefined> {
    const groupIds = await this.getSetMembers(`room:${roomId}:groups`);
    if (groupIds.length === 0) return undefined;

    const groups: { [groupId: string]: string[] } = {};
    await Promise.all(
      groupIds.map(async (groupId) => {
        const participants = await this.getSetMembers(
          `room:${roomId}:group:${groupId}`
        );
        if (participants.length > 0) {
          groups[groupId] = participants;
        }
      })
    );

    return Object.keys(groups).length > 0 ? groups : undefined;
  }

  private async setGroups(
    roomId: string,
    groups: { [groupId: string]: string[] }
  ): Promise<void> {
    // Clear existing groups first
    await this.clearGroups(roomId);

    // Add new groups
    const groupIds = Object.keys(groups);
    if (groupIds.length > 0) {
      await Promise.all([
        // Store group IDs
        this.redis.sadd(`room:${roomId}:groups`, ...groupIds),
        // Store participants for each group
        ...groupIds.map((groupId) =>
          this.redis.sadd(`room:${roomId}:group:${groupId}`, ...groups[groupId])
        ),
      ]);
    }
  }

  private async clearGroups(roomId: string): Promise<void> {
    const groupIds = await this.getSetMembers(`room:${roomId}:groups`);
    if (groupIds.length > 0) {
      await Promise.all([
        // Delete all group participant sets
        ...groupIds.map((groupId) =>
          this.redis.del(`room:${roomId}:group:${groupId}`)
        ),
        // Delete the groups set itself
        this.redis.del(`room:${roomId}:groups`),
      ]);
    }
  }
}
