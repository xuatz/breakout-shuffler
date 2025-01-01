import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Server as HTTPSServer } from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import { Redis } from 'ioredis';
import { RoomService } from './modules/rooms/room.service';
import { SocketService } from './modules/sockets/socket.service';

// Create Redis client
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

// Initialize services
const roomService = new RoomService(redis);

const app = new Hono();

const origin = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://192.168.2.136:5173',
  'https://client.xuatz.local',
];

app.use(
  '*',
  cors({
    origin,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
);

// Room management endpoints
app.post('/rooms', async (c) => {
  const { roomId, hostId } = await roomService.createRoom();
  return c.json({ roomId, hostId });
});

app.get('/rooms/:id', async (c) => {
  const roomId = c.req.param('id');
  const room = await roomService.getRoom(roomId);
  if (!room) {
    return c.json({ error: 'Room not found' }, 404);
  }
  return c.json(room);
});

app.post('/rooms/:id/join', async (c) => {
  const roomId = c.req.param('id');
  const { userId, userName } = await roomService.joinRoom(roomId);
  return c.json({ userId, userName });
});

app.get('/', (c) => {
  return c.text('Hello Hono!');
});

const port = 9000;
console.log(`Server is running on http://localhost:${port}`);

const server = serve({
  fetch: app.fetch,
  port,
});

const io = new SocketIOServer(server as HTTPSServer, {
  connectionStateRecovery: {
    maxDisconnectionDuration: 24 * 60 * 60 * 1000,
    skipMiddlewares: true,
  },
  cors: {
    origin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Initialize socket service
new SocketService(io, roomService);
