import { Server, Socket } from 'socket.io';
import { RoomService } from '../rooms/room.service';

export class SocketService {
  private io: Server;
  private roomService: RoomService;
  private clientMap: Map<string, Socket>;

  constructor(io: Server, roomService: RoomService) {
    this.io = io;
    this.roomService = roomService;
    this.clientMap = new Map();
    this.setupSocketEvents();
  }

  private setupSocketEvents() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`New connection: ${socket.id}`);

      socket.on(
        'joinRoom',
        async ({ roomId, name }: { roomId: string; name?: string }) => {
          try {
            // Extract userId from cookie
            const cookie = socket.handshake.headers.cookie;
            const userId = this.extractUserId(cookie);

            if (!userId) {
              throw new Error('No user ID found');
            }

            const room = await this.roomService.joinRoom({ roomId, userId });

            socket.join(roomId);
            socket.emit('joinedRoom', {
              userId,
              userName: name || this.generateRandomName(),
              room,
            });

            // Notify other users in the room
            socket.to(roomId).emit('userJoined', {
              userId,
              userName: name || this.generateRandomName(),
            });

            const clients = await this.io.in(roomId).fetchSockets();
            const clientInfo = clients.map((client) => ({
              id: client.id,
              userId: this.extractUserId(client.handshake.headers.cookie),
            }));
            console.log(
              `Room ${roomId} has the following clients:`,
              clientInfo
            );
            // Room 4679c3d5-cec5-47d5-aee7-86356583d3b4 has the following clients: [
            //   {
            //     id: '3FOQ-7XGYAJhR3cXAAAQ',
            //     userId: '921541743-4235533644-2401553642-1057335252'
            //   },
            //   {
            //     id: 'bvFH8Y9vYl814nBcAAAT',
            //     userId: '1242176271-3982710007-682346694-1723789797'
            //   }
            // ]
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

  /**
   * TODO (phase1) do something with this
   */
  private generateRandomName(): string {
    const adjectives = ['Happy', 'Silly', 'Clever', 'Brave', 'Gentle'];
    const nouns = ['Penguin', 'Lion', 'Tiger', 'Bear', 'Owl'];
    const randomAdjective =
      adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${randomAdjective} ${randomNoun}`;
  }
}
