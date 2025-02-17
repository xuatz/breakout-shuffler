import { Server, Socket } from 'socket.io';
import { RoomService } from './room.service';
import { UserRepository } from '../repositories/user.repository';
import { NudgeRepository } from '../repositories/nudge.repository';
import { CookieService } from './cookie.service';

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

      // Room events
      socket.on(
        'joinRoom',
        async ({ roomId, displayName }: { roomId: string; displayName: string }) => {
          try {
            const userId = this.getUserId(socket);
            await this.roomService.joinRoom(roomId, userId, displayName);
            socket.join(roomId);

            socket.emit('joinedRoom', { userId, roomId });

            const participants = await this.roomService.getParticipants(roomId);
            this.io.to(roomId).emit('participantsUpdated', { participants });
          } catch (error) {
            this.handleError(socket, 'Join room error', error);
          }
        }
      );

      socket.on('createRoom', async () => {
        try {
          const hostId = this.getUserId(socket);
          const displayName = this.getDisplayName(socket);

          if (displayName) {
            await this.userRepository.updateDisplayName(hostId, displayName);
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

      // User events
      socket.on(
        'updateDisplayName',
        async ({ displayName }: { displayName: string }) => {
          try {
            const userId = this.getUserId(socket);
            await this.userRepository.updateDisplayName(userId, displayName);

            const room = await this.roomService.getRoomByParticipant(userId);
            if (!room) {
              console.log('User is not in a room, do nothing.');
              return;
            }

            const participants = await this.roomService.getParticipants(room.id);
            this.io.to(room.id).emit('participantsUpdated', { participants });
          } catch (error) {
            this.handleError(socket, 'Update display name error', error);
          }
        }
      );

      // Debug events
      socket.on(
        'debugPing',
        ({ pingerId, roomId }: { pingerId: string; roomId: string }) => {
          try {
            console.log(`Debug ping from ${pingerId} in room ${roomId}`);
            socket.to(roomId).emit('debugPing', { pingerId, roomId });
          } catch (error) {
            this.handleError(socket, 'Debug ping error', error);
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

          const userInfo = await this.userRepository.getUserInfo(userId);
          if (!userInfo?.displayName) {
            throw new Error('User display name not found');
          }

          await this.nudgeRepository.updateNudge(
            room.id,
            userId,
            userInfo.displayName
          );

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
    });
  }

  private getUserId(socket: Socket): string {
    const userId = this.cookieService.extractUserId(socket.handshake.headers.cookie);
    if (!userId) {
      throw new Error('No user ID found');
    }
    return userId;
  }

  private getDisplayName(socket: Socket): string | undefined {
    return decodeURI(
      this.cookieService.extractDisplayName(socket.handshake.headers.cookie) || ''
    );
  }

  private handleError(socket: Socket, context: string, error: unknown) {
    console.error(context + ':', error);
    socket.emit('error', {
      message: error instanceof Error ? error.message : context,
    });
  }
}
