import { Redis } from 'ioredis';
import { Server, Socket } from 'socket.io';
import { RoomService } from '../rooms/room.service';

interface NudgeData {
  userId: string;
  displayName: string;
  count: number;
  lastNudge: Date;
}

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
        async ({
          roomId,
          displayName,
        }: {
          roomId: string;
          displayName: string;
        }) => {
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
              participants,
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
          const displayName = decodeURI(this.extractDisplayName(cookie) || '');

          if (!hostId) {
            throw new Error('No host ID found');
          }

          Boolean(displayName) && await this.redis.hset(`user:${hostId}`, {
            displayName,
          });

          const room = await this.roomService.createRoom(hostId);
          socket.join(room.id);
          socket.emit('roomCreated', room);

          const participants = await this.roomService.getParticipants(room.id);
          this.io.to(room.id).emit('participantsUpdated', {
            participants,
          });
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

      socket.on(
        'updateDisplayName',
        async ({ displayName }: { displayName: string }) => {
          try {
            const cookie = socket.handshake.headers.cookie;
            const userId = this.extractUserId(cookie);

            if (!userId) {
              throw new Error('No user ID found');
            }

            await this.redis.hset(`user:${userId}`, {
              displayName,
            });

            // Get the room the user is in
            const room = await this.roomService.getRoomByParticipant(userId);

            if (!room) {
              console.log('User is not in a room, do nothing.');
              return;
            }

            const participants = await this.roomService.getParticipants(
              room.id
            );
            this.io.to(room.id).emit('participantsUpdated', {
              participants,
            });
          } catch (error) {
            console.error('Update display name error:', error);
            socket.emit('error', {
              message:
                error instanceof Error
                  ? error.message
                  : 'Failed to update display name',
            });
          }
        }
      );

      socket.on(
        'debugPing',
        ({ pingerId, roomId }: { pingerId: string; roomId: string }) => {
          try {
            console.log(`Debug ping from ${pingerId} in room ${roomId}`);
            socket.to(roomId).emit('debugPing', { pingerId, roomId });
          } catch (error) {
            console.error('Debug ping error:', error);
            socket.emit('error', {
              message:
                error instanceof Error
                  ? error.message
                  : 'Failed to process ping',
            });
          }
        }
      );

      socket.on('nudgeHost', async () => {
        try {
          const cookie = socket.handshake.headers.cookie;
          const userId = this.extractUserId(cookie);

          if (!userId) {
            throw new Error('No user ID found');
          }

          // Get the room the user is in
          const room = await this.roomService.getRoomByParticipant(userId);
          if (!room) {
            throw new Error('User is not in a room');
          }

          // Get user's display name
          const userInfo = await this.redis.hgetall(`user:${userId}`);
          if (!userInfo.displayName) {
            throw new Error('User display name not found');
          }

          // Update nudge count in Redis
          const nudgeKey = `host_nudges:${room.id}`;
          const nudgeData = await this.redis.hget(nudgeKey, userId);
          let currentData: NudgeData;

          if (nudgeData) {
            currentData = JSON.parse(nudgeData);
            currentData.count += 1;
            currentData.lastNudge = new Date();
          } else {
            currentData = {
              userId,
              displayName: userInfo.displayName,
              count: 1,
              lastNudge: new Date(),
            };
          }

          await this.redis.hset(nudgeKey, userId, JSON.stringify(currentData));

          // Get all nudges for the room
          const allNudges = await this.redis.hgetall(nudgeKey);
          const nudgeList = Object.values(allNudges).map((data) =>
            JSON.parse(data)
          );

          // Emit to host
          this.io.to(room.id).emit('hostNudged', {
            nudges: nudgeList,
          });
        } catch (error) {
          console.error('Nudge host error:', error);
          socket.emit('error', {
            message:
              error instanceof Error ? error.message : 'Failed to nudge host',
          });
        }
      });

      socket.on('clearNudges', async () => {
        try {
          const cookie = socket.handshake.headers.cookie;
          const userId = this.extractUserId(cookie);

          if (!userId) {
            throw new Error('No user ID found');
          }

          // Get the room the user is in
          const room = await this.roomService.getRoomByParticipant(userId);
          if (!room) {
            throw new Error('User is not in a room');
          }

          // Verify user is the host
          if (room.hostId !== userId) {
            throw new Error('Only the host can clear nudges');
          }

          // Clear nudges for the room
          await this.redis.del(`host_nudges:${room.id}`);

          // Notify clients that nudges were cleared
          this.io.to(room.id).emit('hostNudged', {
            nudges: [],
          });
        } catch (error) {
          console.error('Clear nudges error:', error);
          socket.emit('error', {
            message:
              error instanceof Error ? error.message : 'Failed to clear nudges',
          });
        }
      });

      socket.on('getNudges', async () => {
        try {
          const cookie = socket.handshake.headers.cookie;
          const userId = this.extractUserId(cookie);

          if (!userId) {
            throw new Error('No user ID found');
          }

          // Get the room the user is in
          const room = await this.roomService.getRoomByParticipant(userId);
          if (!room) {
            throw new Error('User is not in a room');
          }

          // Get all nudges for the room
          const nudgeKey = `host_nudges:${room.id}`;
          const allNudges = await this.redis.hgetall(nudgeKey);
          const nudgeList = Object.values(allNudges).map((data) =>
            JSON.parse(data)
          );

          socket.emit('hostNudged', {
            nudges: nudgeList,
          });
        } catch (error) {
          console.error('Get nudges error:', error);
          socket.emit('error', {
            message:
              error instanceof Error ? error.message : 'Failed to get nudges',
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

  private extractCookieValue({
    cookie,
    key,
  }: {
    cookie?: string;
    key: string;
  }) {
    if (!cookie) return undefined;

    const cookies = cookie.split(';').reduce((acc, curr) => {
      const [key, value] = curr.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as { [key: string]: string });

    return cookies[key];
  }

  private extractUserId(cookie?: string): string | undefined {
    return this.extractCookieValue({
      cookie,
      key: '_bsid',
    });
  }

  private extractDisplayName(cookie?: string): string | undefined {
    return this.extractCookieValue({
      cookie,
      key: '_displayName',
    });
  }
}
