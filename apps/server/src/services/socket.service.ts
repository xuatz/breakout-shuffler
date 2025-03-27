import { Server, Socket } from 'socket.io';
import { RoomService } from './room.service';
import { UserRepository } from '../repositories/user.repository';
import { NudgeRepository } from '../repositories/nudge.repository';
import { CookieService } from './cookie.service';
import { generateRandomName } from '../utils/generateRandomName';

interface GroupAllocationRequest {
  roomId: string;
  mode: 'size' | 'count';
  value: number;
  distribution: number[]; // array of group sizes
}

interface KickUserRequest {
  roomId: string;
  targetUserId: string;
}

export class SocketService {
  private clientMap: Map<string, Socket>;
  private cookieService: CookieService;

  constructor(
    private io: Server,
    private roomService: RoomService,
    private userRepository: UserRepository,
    private nudgeRepository: NudgeRepository
  ) {
    this.clientMap = new Map();
    this.cookieService = new CookieService();
    this.setupSocketEvents();
  }

  private setupSocketEvents() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`New connection: ${socket.id}`);

      // Client management
      socket.on('registerClient', (userId: string) => {
        this.clientMap.set(userId, socket);
        console.log(`Registered client: ${userId}`);
      });

      socket.on('disconnect', () => {
        for (const [userId, sock] of this.clientMap.entries()) {
          if (sock.id === socket.id) {
            this.clientMap.delete(userId);
            console.log(`Unregistered client: ${userId}`);
            break;
          }
        }
        console.log(`Disconnected: ${socket.id}`);
      });

      socket.on('kickUser', async (request: KickUserRequest) => {
        try {
          const userId = this.getUserId(socket);
          const room = await this.roomService.getRoom(request.roomId);

          if (!room) {
            throw new Error('Room not found');
          }

          if (room.hostId !== userId) {
            throw new Error('Only the host can kick users');
          }

          await this.roomService.removeParticipant(request.roomId, request.targetUserId);
          
          // Notify the kicked user
          const kickedUserSocket = this.clientMap.get(request.targetUserId);
          if (kickedUserSocket) {
            kickedUserSocket.emit('kicked', { roomId: request.roomId });
            kickedUserSocket.leave(request.roomId);
          }

          // Update participant list for remaining users
          const participants = await this.roomService.getParticipants(request.roomId);
          this.io.to(request.roomId).emit('participantsUpdated', { participants });
        } catch (error) {
          this.handleError(socket, 'Kick user error', error);
        }
      });

      // Room events
      socket.on('joinRoom', async ({ roomId }: { roomId: string }) => {
        try {
          const userId = this.getUserId(socket);
          await this.roomService.joinRoom(roomId, userId);
          socket.join(roomId);

          socket.emit('joinedRoom', { userId, roomId });

          const participants = await this.roomService.getParticipants(roomId);
          this.io.to(roomId).emit('participantsUpdated', { participants });

          // Send current room state to the joining participant
          const room = await this.roomService.getRoom(roomId);
          if (room) {
            socket.emit('roomStateUpdated', {
              state: room.state,
              groups: room.groups,
            });
          }
        } catch (error) {
          this.handleError(socket, 'Join room error', error);
        }
      });

      socket.on('createRoom', async () => {
        try {
          const hostId = this.getUserId(socket);
          const displayName = await this.getDisplayName(hostId);
          if (!displayName) {
            throw new Error('Display name not found');
          }

          const room = await this.roomService.createRoom(hostId);
          socket.join(room.id);
          socket.emit('roomCreated', room);

          const participants = await this.roomService.getParticipants(room.id);
          this.io.to(room.id).emit('participantsUpdated', { participants });
        } catch (error) {
          this.handleError(socket, 'Create room error', error);
        }
      });

      // Breakout events
      socket.on('startBreakout', async (request: GroupAllocationRequest) => {
        try {
          const userId = this.getUserId(socket);
          const room = await this.roomService.getRoom(request.roomId);

          if (!room) {
            throw new Error('Room not found');
          }

          if (room.hostId !== userId) {
            throw new Error('Only the host can start breakout');
          }

          const updatedRoom = await this.roomService.startBreakout(
            request.roomId,
            request.distribution
          );
          this.io.to(request.roomId).emit('roomStateUpdated', {
            state: updatedRoom.state,
            groups: updatedRoom.groups,
          });
        } catch (error) {
          this.handleError(socket, 'Start breakout error', error);
        }
      });

      socket.on('endBreakout', async ({ roomId }: { roomId: string }) => {
        try {
          const userId = this.getUserId(socket);
          const room = await this.roomService.getRoom(roomId);

          if (!room) {
            throw new Error('Room not found');
          }

          if (room.hostId !== userId) {
            throw new Error('Only the host can end breakout');
          }

          const updatedRoom = await this.roomService.endBreakout(roomId);
          this.io.to(roomId).emit('roomStateUpdated', {
            state: updatedRoom.state,
            groups: updatedRoom.groups,
          });
        } catch (error) {
          this.handleError(socket, 'End breakout error', error);
        }
      });

      socket.on('abortBreakout', async ({ roomId }: { roomId: string }) => {
        try {
          const userId = this.getUserId(socket);
          const room = await this.roomService.getRoom(roomId);

          if (!room) {
            throw new Error('Room not found');
          }

          if (room.hostId !== userId) {
            throw new Error('Only the host can abort breakout');
          }

          const updatedRoom = await this.roomService.abortBreakout(roomId);
          this.io.to(roomId).emit('roomStateUpdated', {
            state: updatedRoom.state,
            groups: updatedRoom.groups,
          });
        } catch (error) {
          this.handleError(socket, 'Abort breakout error', error);
        }
      });

      // Debug events
      socket.on(
        'debugPing',
        async ({ pingerId, roomId }: { pingerId: string; roomId: string }) => {
          console.log(`Debug ping from ${pingerId} in room ${roomId}`);
          socket.to(roomId).emit('debugPing', { pingerId, roomId });

          const userId = this.getUserId(socket);
          const room = await this.roomService.getRoomByParticipant(userId)

          if (!room) {
            return;
          }
        }
      );

      socket.on(
        'debugAddDummyParticipants',
        async ({ roomId, count }: { roomId: string; count: number }) => {
          try {
            const userId = this.getUserId(socket);
            const room = await this.roomService.getRoom(roomId);

            if (!room) {
              throw new Error('Room not found');
            }

            if (room.hostId !== userId) {
              throw new Error('Only the host can add dummy participants');
            }

            // Add dummy participants
            for (let i = 0; i < count; i++) {
              const dummyId = `dummy-${Date.now()}-${i}`;
              const dummyName = `${generateRandomName()} (dummy)`;
              await this.userRepository.updateDisplayName(dummyId, dummyName);
              await this.roomService.joinRoom(roomId, dummyId);
            }

            const participants = await this.roomService.getParticipants(roomId);
            this.io.to(roomId).emit('participantsUpdated', { participants });
          } catch (error) {
            this.handleError(socket, 'Add dummy participants error', error);
          }
        }
      );

      // Nudge events
      socket.on('nudgeHost', async () => {
        try {
          const userId = this.getUserId(socket);
          const room = await this.roomService.getRoomByParticipant(userId);
          if (!room) {
            throw new Error('User is not in a room');
          }

          const displayName = await this.getDisplayName(userId);
          if (!displayName) {
            throw new Error('User display name not found');
          }

          await this.nudgeRepository.updateNudge(room.id, userId, displayName);

          const nudges = await this.nudgeRepository.getNudges(room.id);
          this.io.to(room.id).emit('hostNudged', { nudges });
        } catch (error) {
          this.handleError(socket, 'Nudge host error', error);
        }
      });

      socket.on('clearNudges', async () => {
        try {
          const userId = this.getUserId(socket);
          const room = await this.roomService.getRoomByParticipant(userId);
          if (!room) {
            throw new Error('User is not in a room');
          }

          if (room.hostId !== userId) {
            throw new Error('Only the host can clear nudges');
          }

          await this.nudgeRepository.clearNudges(room.id);
          this.io.to(room.id).emit('hostNudged', { nudges: [] });
        } catch (error) {
          this.handleError(socket, 'Clear nudges error', error);
        }
      });

      socket.on('getNudges', async () => {
        try {
          const userId = this.getUserId(socket);
          const room = await this.roomService.getRoomByParticipant(userId);
          if (!room) {
            throw new Error('User is not in a room');
          }

          const nudges = await this.nudgeRepository.getNudges(room.id);
          socket.emit('hostNudged', { nudges });
        } catch (error) {
          this.handleError(socket, 'Get nudges error', error);
        }
      });

      // Liveliness events
      socket.on('updateLiveliness', async () => {
        try {
          const userId = this.getUserId(socket);
          await this.userRepository.updateLiveliness(userId);
        } catch (error) {
          this.handleError(socket, 'Update liveliness error', error);
        }
      });
    });
  }

  private getUserId(socket: Socket): string {
    const userId = this.cookieService.extractUserId(
      socket.handshake.headers.cookie
    );
    if (!userId) {
      throw new Error('No user ID found');
    }
    return userId;
  }

  private async getDisplayName(userId: string): Promise<string | undefined> {
    return this.userRepository.getDisplayName(userId);
  }

  private handleError(socket: Socket, context: string, error: unknown) {
    console.error(context + ':', error);
    socket.emit('error', {
      message: error instanceof Error ? error.message : context,
    });
  }
}
