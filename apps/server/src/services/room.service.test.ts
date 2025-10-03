import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RoomService, Room, User } from './room.service';
import { RoomRepository } from '../repositories/room.repository';
import { UserRepository } from '../repositories/user.repository';

describe('RoomService', () => {
  let roomService: RoomService;
  let roomRepository: RoomRepository;
  let userRepository: UserRepository;

  const mockRoom: Room = {
    id: 'room-1',
    hostId: 'host-1',
    createdAt: new Date(),
    state: 'waiting',
  };

  const mockParticipants: string[] = [
    'user-1',
    'user-2',
    'user-3',
    'user-4',
    'user-5',
  ];

  beforeEach(() => {
    roomRepository = {
      getRoom: vi.fn(),
      updateRoom: vi.fn(),
      getParticipants: vi.fn(),
    } as unknown as RoomRepository;

    userRepository = {
      getUserInfo: vi.fn(),
    } as unknown as UserRepository;

    roomService = new RoomService(roomRepository, userRepository);
  });

  describe('startBreakout', () => {
    it('throws error if room not found', async () => {
      vi.spyOn(roomRepository, 'getRoom').mockResolvedValue(undefined);

      await expect(roomService.startBreakout('room-1', [2, 2])).rejects.toThrow(
        'Room not found',
      );
    });

    it('throws error if no participants', async () => {
      vi.spyOn(roomRepository, 'getRoom').mockResolvedValue(mockRoom);
      vi.spyOn(roomRepository, 'getParticipants').mockResolvedValue([]);

      await expect(roomService.startBreakout('room-1', [2, 2])).rejects.toThrow(
        'No participants in room',
      );
    });

    it('throws error if distribution total does not match participant count', async () => {
      vi.spyOn(roomRepository, 'getRoom').mockResolvedValue(mockRoom);
      vi.spyOn(roomRepository, 'getParticipants').mockResolvedValue(
        mockParticipants,
      );

      await expect(roomService.startBreakout('room-1', [2, 2])).rejects.toThrow(
        'Distribution total does not match participant count',
      );
    });

    it('creates groups based on distribution', async () => {
      vi.spyOn(roomRepository, 'getRoom').mockResolvedValue(mockRoom);
      vi.spyOn(roomRepository, 'getParticipants').mockResolvedValue(
        mockParticipants,
      );
      vi.spyOn(roomRepository, 'updateRoom').mockResolvedValue();

      // Mock Math.random to ensure consistent shuffling for test
      const mockMath = Object.create(global.Math);
      mockMath.random = () => 0.5;
      global.Math = mockMath;

      const distribution = [3, 2]; // 5 participants total
      const result = await roomService.startBreakout('room-1', distribution);

      expect(result.state).toBe('active');
      expect(Object.keys(result.groups!).length).toBe(2);
      expect(result.groups![0].length).toBe(3); // First group has 3 participants
      expect(result.groups![1].length).toBe(2); // Second group has 2 participants

      // Verify all participants are assigned
      const allAssignedParticipants = [
        ...result.groups![0],
        ...result.groups![1],
      ];
      expect(allAssignedParticipants.length).toBe(mockParticipants.length);
      expect(new Set(allAssignedParticipants).size).toBe(
        mockParticipants.length,
      ); // No duplicates
    });

    it('updates room with new state and groups', async () => {
      vi.spyOn(roomRepository, 'getRoom').mockResolvedValue(mockRoom);
      vi.spyOn(roomRepository, 'getParticipants').mockResolvedValue(
        mockParticipants,
      );
      const updateRoomSpy = vi
        .spyOn(roomRepository, 'updateRoom')
        .mockResolvedValue();

      const distribution = [3, 2];
      const result = await roomService.startBreakout('room-1', distribution);

      expect(updateRoomSpy).toHaveBeenCalledWith('room-1', result);
      expect(result.state).toBe('active');
      expect(result.groups).toBeDefined();
    });
  });
});
