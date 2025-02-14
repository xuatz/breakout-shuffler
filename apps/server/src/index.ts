import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getCookie } from 'hono/cookie';
import type { Server as HTTPSServer } from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import { Redis } from 'ioredis';
import { RoomService } from './modules/rooms/room.service';
import { SocketService } from './modules/sockets/socket.service';
import { HTTPException } from 'hono/http-exception';

const origin = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://192.168.2.136:5173',
  'https://client.breakout.local',
];

// Create Redis client
const redis = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

// Initialize services
const roomService = new RoomService(redis);

const app = new Hono();
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
const socketService = new SocketService(io, roomService);

app.use(
  '*',
  cors({
    origin,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
);

app.get('/host', async (c) => {
  const userId = getCookie(c, '_bsid');
  console.log('xz:userId', userId);
  if (!userId) {
    throw new HTTPException(403, { message: 'Missing userId' });
  }

  const room = await roomService.getRoomByHost(userId);
  if (!room) {
    return c.json({ room: undefined });
  }

  return c.json({ room });
});

app.post('/rooms', async (c) => {
  const hostId = getCookie(c, '_bsid');
  if (!hostId) {
    throw new HTTPException(403, { message: 'Missing userId' });
  }
  const room = await roomService.createRoom(hostId);
  return c.json({ room: room });
});

app.get('/rooms', async (c) => {
  const rooms = await roomService.getRooms();
  return c.json({ rooms });
});

// ------------------------------

app.get('/rooms/:id', async (c) => {
  const roomId = c.req.param('id');
  const room = await roomService.getRoom(roomId);
  if (!room) {
    return c.json({ error: 'Room not found' }, 404);
  }
  return c.json(room);
});

app.post('/rooms/:id/join', async (c) => {
  console.log('xz:hoho');
  const roomId = c.req.param('id');
  const userId = getCookie(c, '_bsid');

  console.log('xz:userId', userId);

  if (!userId) {
    throw new HTTPException(403, { message: 'Missing userId' });
  }

  const roomExists = await roomService.roomExists(roomId);
  console.log('xz:roomExists', roomExists);
  if (!roomExists) {
    throw new HTTPException(404, { message: `Room ${roomId} does not exist.` });
  }

  const success = await roomService.joinRoom(roomId, userId);

  if (success) {
    return c.json({ success: true });
  }

  throw new HTTPException(500, { message: 'Failed to join room' });
});

app.get('/', (c) => {
  return c.text('Hello Hono!');
});
