import { Redis } from 'ioredis';
import { Server, Socket } from 'socket.io';
import { RoomService } from '../rooms/room.service';

export class SocketService {
  private io: Server;
  private redis: Redis;
  private roomService: RoomService;
  private clientMap: Map<string, Socket>;

  constructor(io: Server, redis: Redis, roomService: RoomService) {
    this.io = io;
    this.redis = redis;
    this.roomService = roomService;
    this.clientMap = new Map();
    this.setupSocketEvents();
  }

  private setupSocketEvents() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`New connection: ${socket.id}`);

      socket.on(
        'joinRoom',
        async ({ roomId, displayName }: { roomId: string; displayName: string }) => {
          try {
            // Extract userId from cookie
            const cookie = socket.handshake.headers.cookie;
            const userId = this.extractUserId(cookie);

            if (!userId) {
              throw new Error('No user ID found');
            }

            await this.roomService.joinRoom(roomId, userId, displayName);
            socket.join(roomId);

            // Emit room joined event to the new participant
            socket.emit('joinedRoom', {
              userId,
              roomId,
            });
            
            const participants = await this.roomService.getParticipants(roomId);
            this.io.to(roomId).emit('participantsUpdated', {
              participants
            });
          } catch (error) {
            console.error('Join room error:', error);
            socket.emit('error', {
              message:
                error instanceof Error ? error.message : 'Failed to join room',
            });
          }
        }
      );

      socket.on('createRoom', async () => {
        try {
          const cookie = socket.handshake.headers.cookie;
          const hostId = this.extractUserId(cookie);

          if (!hostId) {
            throw new Error('No host ID found');
          }

          const room = await this.roomService.createRoom(hostId);
          socket.join(room.id);
          socket.emit('roomCreated', room);
        } catch (error) {
          console.error('Create room error:', error);
          socket.emit('error', {
            message:
              error instanceof Error ? error.message : 'Failed to create room',
          });
        }
      });

      socket.on('registerClient', (userId: string) => {
        this.clientMap.set(userId, socket);
        console.log(`Registered client: ${userId}`);
      });

      socket.on('updateDisplayName', async ({ displayName }: { displayName: string }) => {
        try {
          const cookie = socket.handshake.headers.cookie;
          const userId = this.extractUserId(cookie);

          if (!userId) {
            throw new Error('No user ID found');
          }

          await this.redis.hset(`user:${userId}`, {
            displayName,
          })

          // Get the room the user is in
          const room = await this.roomService.getRoomByParticipant(userId);

          if (!room) {
            console.log('User is not in a room, do nothing.');
            return;
          }
          
          const participants = await this.roomService.getParticipants(room.id);
          this.io.to(room.id).emit('participantsUpdated', {
            participants
          });
        } catch (error) {
          console.error('Update display name error:', error);
          socket.emit('error', {
            message: error instanceof Error ? error.message : 'Failed to update display name',
          });
        }
      });

      socket.on('debugPing', ({ pingerId, roomId }: { pingerId: string; roomId: string }) => {
        try {
          console.log(`Debug ping from ${pingerId} in room ${roomId}`);
          socket.to(roomId).emit('debugPing', { pingerId, roomId });
        } catch (error) {
          console.error('Debug ping error:', error);
          socket.emit('error', {
            message: error instanceof Error ? error.message : 'Failed to process ping',
          });
        }
      });

      socket.on('disconnect', () => {
        // Remove from client map
        for (const [userId, sock] of this.clientMap.entries()) {
          if (sock.id === socket.id) {
            this.clientMap.delete(userId);
            console.log(`Unregistered client: ${userId}`);
            break;
          }
        }
        console.log(`Disconnected: ${socket.id}`);
      });
    });
  }

  private extractUserId(cookie?: string): string | undefined {
    if (!cookie) return undefined;

    const cookies = cookie.split(';').reduce((acc, curr) => {
      const [key, value] = curr.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as { [key: string]: string });

    return cookies['_bsid'];
  }
}
