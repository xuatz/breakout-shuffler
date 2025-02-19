import { RoomRepository } from '../repositories/room.repository';
import { UserRepository } from '../repositories/user.repository';

export interface Room {
  id: string;
  hostId: string;
  createdAt: Date;
  state: 'waiting' | 'active';
  groups?: { [groupId: string]: string[] };
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
      state: 'waiting',
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

  async joinRoom(roomId: string, userId: string): Promise<boolean> {
    const room = await this.roomRepository.getRoom(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    await Promise.all([
      this.roomRepository.addParticipant(roomId, userId),
      this.userRepository.addUserToRoom(userId, roomId),
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

  async startBreakout(roomId: string, distribution: number[]): Promise<Room> {
    const room = await this.roomRepository.getRoom(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const participants = await this.getParticipants(roomId);
    if (participants.length === 0) {
      throw new Error('No participants in room');
    }

    // Validate distribution total matches participant count
    const totalInDistribution = distribution.reduce(
      (sum, size) => sum + size,
      0
    );
    if (totalInDistribution !== participants.length) {
      throw new Error('Distribution total does not match participant count');
    }

    // Randomly shuffle participants
    const shuffledParticipants = [...participants].sort(
      () => Math.random() - 0.5
    );

    // Create groups based on the distribution
    const groups: { [groupId: string]: string[] } = {};
    let participantIndex = 0;

    distribution.forEach((size, groupIndex) => {
      const groupParticipants = shuffledParticipants
        .slice(participantIndex, participantIndex + size)
        .map((p) => p.id);
      groups[groupIndex] = groupParticipants;
      participantIndex += size;
    });

    const updatedRoom: Room = {
      ...room,
      state: 'active',
      groups,
    };

    await this.roomRepository.updateRoom(roomId, updatedRoom);
    return updatedRoom;
  }

  async endBreakout(roomId: string): Promise<Room> {
    const room = await this.roomRepository.getRoom(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const updatedRoom: Room = {
      ...room,
      state: 'waiting',
      groups: undefined,
    };

    await this.roomRepository.updateRoom(roomId, updatedRoom);
    return updatedRoom;
  }

  async abortBreakout(roomId: string): Promise<Room> {
    // For now, abort and end do the same thing
    return this.endBreakout(roomId);
  }
}
