import { Server, Socket } from 'socket.io';
import { RoomService } from '../rooms/room.service';

export class SocketService {
  private io: Server;
  private roomService: RoomService;

  constructor(io: Server, roomService: RoomService) {
    this.io = io;
    this.roomService = roomService;
    this.setupSocketEvents();
  }

  private setupSocketEvents() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`New connection: ${socket.id}`);

      socket.on('createRoom', async () => {
        try {
          const { roomId, hostId } = await this.roomService.createRoom();
          socket.join(roomId);
          socket.emit('roomCreated', { roomId, hostId });
        } catch (error) {
          socket.emit('error', { message: 'Failed to create room' });
        }
      });

      socket.on('joinRoom', async (roomId: string) => {
        try {
          const { userId, userName } = await this.roomService.joinRoom(roomId);
          socket.join(roomId);
          socket.emit('joinedRoom', { userId, userName });
          this.io.to(roomId).emit('userJoined', { userId, userName });
        } catch (error) {
          socket.emit('error', { message: 'Failed to join room' });
        }
      });

      socket.on('disconnect', () => {
        console.log(`Disconnected: ${socket.id}`);
      });
    });
  }
}
