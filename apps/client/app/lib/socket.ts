import { io } from 'socket.io-client';

const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:9000';

export const socket = io(socketUrl, {
  // autoUnref: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export const sendSocketMessage = (event: string, data: any) => {
  socket.emit(event, data);
};
