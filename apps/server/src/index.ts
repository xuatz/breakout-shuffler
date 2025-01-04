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

// Create Redis client
const redis = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

// Initialize services
const roomService = new RoomService(redis);

const app = new Hono();

const origin = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://192.168.2.136:5173',
  'https://client.breakout.local',
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
  const hostId = getCookie(c, '_bsid');
  if (!hostId) {
    throw new HTTPException(403, { message: 'Missing userId' });
  }
  const { roomId } = await roomService.createRoom(hostId);
  return c.json({ roomId, hostId });
});

app.get('/host', async (c) => {
  const userId = getCookie(c, '_bsid');
  if (!userId) {
    throw new HTTPException(403, { message: 'Missing userId' });
  }

  // 2. Get room owned by hostId; should only have one room
  const [room] = await roomService.getRoomsByHost(userId);
  if (!room) {
    return c.json(undefined);
  }

  // 3. Return room info
  return c.json(room);
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
