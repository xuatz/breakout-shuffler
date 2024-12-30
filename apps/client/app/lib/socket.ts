import { io } from 'socket.io-client';

// Create socket connection
export const socket = io('http://localhost:9000', {
  // Optional configuration
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Socket event handlers
export const setupSocketListeners = () => {
  socket.on('connect', () => {
    console.log('Connected to Socket.IO server');
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from Socket.IO server');
  });

  socket.on('hello', (data) => {
    console.log('Received hello event:', data);
  });
};

// Function to send messages
export const sendSocketMessage = (event: string, data: any) => {
  socket.emit(event, data);
};
