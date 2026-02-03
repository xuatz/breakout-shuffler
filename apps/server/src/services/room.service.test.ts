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

  describe('moveUserToGroup', () => {
    const mockActiveRoom: Room = {
      id: 'room-1',
      hostId: 'host-1',
      createdAt: new Date(),
      state: 'active',
      groups: {
        '0': ['user-1', 'user-2'],
        '1': ['user-3', 'user-4'],
      },
    };

    it('throws error if room not found', async () => {
      vi.spyOn(roomRepository, 'getRoom').mockResolvedValue(undefined);

      await expect(
        roomService.moveUserToGroup('room-1', 'user-1', '1'),
      ).rejects.toThrow('Room not found');
    });

    it('throws error if room is not in active state', async () => {
      vi.spyOn(roomRepository, 'getRoom').mockResolvedValue(mockRoom);

      await expect(
        roomService.moveUserToGroup('room-1', 'user-1', '1'),
      ).rejects.toThrow('Room must be in active state to move users');
    });

    it('throws error if no groups found in room', async () => {
      const activeRoomWithoutGroups: Room = {
        ...mockRoom,
        state: 'active',
      };
      vi.spyOn(roomRepository, 'getRoom').mockResolvedValue(
        activeRoomWithoutGroups,
      );

      await expect(
        roomService.moveUserToGroup('room-1', 'user-1', '1'),
      ).rejects.toThrow('No groups found in room');
    });

    it('moves user from one group to another', async () => {
      vi.spyOn(roomRepository, 'getRoom').mockResolvedValue(mockActiveRoom);
      const updateRoomSpy = vi
        .spyOn(roomRepository, 'updateRoom')
        .mockResolvedValue();

      const result = await roomService.moveUserToGroup(
        'room-1',
        'user-1',
        '1',
      );

      expect(result.groups!['0']).toEqual(['user-2']); // user-1 removed from group 0
      expect(result.groups!['1']).toEqual(['user-3', 'user-4', 'user-1']); // user-1 added to group 1
      expect(updateRoomSpy).toHaveBeenCalledWith('room-1', result);
    });

    it('creates new group if target group does not exist', async () => {
      vi.spyOn(roomRepository, 'getRoom').mockResolvedValue(mockActiveRoom);
      const updateRoomSpy = vi
        .spyOn(roomRepository, 'updateRoom')
        .mockResolvedValue();

      const result = await roomService.moveUserToGroup(
        'room-1',
        'user-1',
        '2',
      );

      expect(result.groups!['0']).toEqual(['user-2']); // user-1 removed from group 0
      expect(result.groups!['2']).toEqual(['user-1']); // new group 2 created with user-1
      expect(updateRoomSpy).toHaveBeenCalledWith('room-1', result);
    });

    it('handles moving user who is not in any group', async () => {
      vi.spyOn(roomRepository, 'getRoom').mockResolvedValue(mockActiveRoom);
      const updateRoomSpy = vi
        .spyOn(roomRepository, 'updateRoom')
        .mockResolvedValue();

      const result = await roomService.moveUserToGroup(
        'room-1',
        'user-5',
        '1',
      );

      expect(result.groups!['1']).toEqual(['user-3', 'user-4', 'user-5']); // user-5 added to group 1
      expect(updateRoomSpy).toHaveBeenCalledWith('room-1', result);
    });
  });

  describe('joinRoom - late joining during active breakout', () => {
    const mockActiveRoom: Room = {
      id: 'room-1',
      hostId: 'host-1',
      createdAt: new Date(),
      state: 'active',
      groups: {
        '0': ['user-1', 'user-2', 'user-3'],
        '1': ['user-4'],
      },
    };

    beforeEach(() => {
      roomRepository.addParticipant = vi.fn().mockResolvedValue(undefined);
      userRepository.addUserToRoom = vi.fn().mockResolvedValue(undefined);
      userRepository.updateLiveliness = vi.fn().mockResolvedValue(undefined);
    });

    it('assigns late joiner to smallest group during active breakout', async () => {
      vi.spyOn(roomRepository, 'getRoom').mockResolvedValue(mockActiveRoom);
      const updateRoomSpy = vi
        .spyOn(roomRepository, 'updateRoom')
        .mockResolvedValue();

      await roomService.joinRoom('room-1', 'user-5');

      expect(updateRoomSpy).toHaveBeenCalled();
      const updatedRoom = updateRoomSpy.mock.calls[0][1] as Room;
      expect(updatedRoom.groups!['1']).toContain('user-5'); // Added to group 1 (smallest)
    });

    it('does not modify groups during waiting state', async () => {
      vi.spyOn(roomRepository, 'getRoom').mockResolvedValue(mockRoom);
      const updateRoomSpy = vi.spyOn(roomRepository, 'updateRoom');

      await roomService.joinRoom('room-1', 'user-5');

      expect(updateRoomSpy).not.toHaveBeenCalled(); // No room update in waiting state
    });
  });
});
