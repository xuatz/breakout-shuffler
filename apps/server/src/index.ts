import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getCookie } from 'hono/cookie';
import type { Server as HTTPSServer } from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import { Redis } from 'ioredis';
import { RoomService } from './services/room.service';
import { SocketService } from './services/socket.service';
import { HTTPException } from 'hono/http-exception';
import { RoomRepository } from './repositories/room.repository';
import { UserRepository } from './repositories/user.repository';
import { NudgeRepository } from './repositories/nudge.repository';

const origin = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://192.168.2.136:5173',
  'https://client.breakout.local',
  'https://breakout-shuffler.xuatz.com',
  'https://breakout-shuffler.pages.dev',
];

// Create Redis client
const redis = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

// Initialize repositories
const roomRepository = new RoomRepository(redis);
const userRepository = new UserRepository(redis);
const nudgeRepository = new NudgeRepository(redis);

// Initialize services
const roomService = new RoomService(roomRepository, userRepository);

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
const socketService = new SocketService(io, roomService, userRepository, nudgeRepository);

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

  const displayName = getCookie(c, '_displayName');
  if (!displayName) {
    throw new HTTPException(403, { message: 'Missing displayName' });
  }

  const success = await roomService.joinRoom(roomId, userId, displayName);

  if (success) {
    return c.json({ success: true });
  }

  throw new HTTPException(500, { message: 'Failed to join room' });
});

app.get('/', (c) => {
  return c.text('Hello Hono!');
});
