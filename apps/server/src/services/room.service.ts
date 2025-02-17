import { RoomRepository } from '../repositories/room.repository';
import { UserRepository } from '../repositories/user.repository';

export interface Room {
  id: string;
  hostId: string;
  createdAt: Date;
}

export interface User {
  id: string;
  displayName?: string;
}

export class RoomService {
  constructor(
    private roomRepository: RoomRepository,
    private userRepository: UserRepository
  ) {}

  async getRooms() {
    return this.roomRepository.getAllRooms();
  }

  async createRoom(hostId: string): Promise<Room> {
    const existingRoom = await this.roomRepository.getRoomByHost(hostId);
    if (existingRoom) {
      throw new Error(`Host ${hostId} already has a room: ${existingRoom.id}`);
    }

    const room: Room = {
      id: crypto.randomUUID(),
      hostId,
      createdAt: new Date(),
    };

    await this.roomRepository.createRoom(room);
    return room;
  }

  async getRoomByHost(hostId: string): Promise<Room | undefined> {
    return this.roomRepository.getRoomByHost(hostId);
  }

  async roomExists(roomId: string): Promise<boolean> {
    return this.roomRepository.exists(roomId);
  }

  async getRoom(roomId: string): Promise<Room | undefined> {
    return this.roomRepository.getRoom(roomId);
  }

  async joinRoom(
    roomId: string,
    userId: string,
    displayName: string
  ): Promise<boolean> {
    const room = await this.roomRepository.getRoom(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    await Promise.all([
      this.roomRepository.addParticipant(roomId, userId),
      this.userRepository.addUserToRoom(userId, roomId),
      this.userRepository.updateDisplayName(userId, displayName),
    ]);

    return true;
  }

  async getParticipants(roomId: string): Promise<User[]> {
    const participantIds = await this.roomRepository.getParticipants(roomId);
    
    const participants = await Promise.all(
      participantIds.map(async (id) => {
        const userData = await this.userRepository.getUserInfo(id);
        return {
          id,
          displayName: userData?.displayName,
        };
      })
    );
    return participants;
  }

  async getRoomByParticipant(userId: string): Promise<Room | undefined> {
    const rooms = await this.userRepository.getUserRooms(userId);
    if (rooms.length === 0) {
      return undefined;
    }

    return this.roomRepository.getRoom(rooms[0]);
  }
}
