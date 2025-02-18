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
import { generateRandomName } from './utils/generateRandomName';

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

app.post('/rooms/:id/me', async (c) => {
  const userId = getCookie(c, '_bsid');
  if (!userId) {
    throw new HTTPException(403, { message: 'Missing userId' });
  }

  const roomId = c.req.param('id');
  if (!roomId) {
    throw new HTTPException(400, { message: 'Missing roomId' });
  }

  const room = await roomService.getRoomByParticipant(userId)
  
  return c.json({ isParticipant: room?.id === roomId });
})

app.post('/rooms/:id/join', async (c) => {
  const roomId = c.req.param('id');
  const userId = getCookie(c, '_bsid');

  if (!userId) {
    throw new HTTPException(403, { message: 'Missing userId' });
  }

  const roomExists = await roomService.roomExists(roomId);
  if (!roomExists) {
    throw new HTTPException(404, { message: `Room ${roomId} does not exist.` });
  }

  const success = await roomService.joinRoom(roomId, userId);

  if (success) {
    return c.json({ success: true });
  }

  throw new HTTPException(500, { message: 'Failed to join room' });
});

app.get('/me/displayName', async (c) => {
  const userId = getCookie(c, '_bsid');
  if (!userId) {
    throw new HTTPException(403, { message: 'Missing userId' });
  }

  console.log('[GET /me/displayName] Request from userId:', userId);
  const displayName = await userRepository.getDisplayName(userId);
  console.log('[GET /me/displayName] Current displayName:', displayName);

  if (!displayName) {
    const newDisplayName = generateRandomName();
    console.log('[GET /me/displayName] Generated new displayName:', newDisplayName);
    await userRepository.updateDisplayName(userId, newDisplayName);
    const savedName = await userRepository.getDisplayName(userId);
    console.log('[GET /me/displayName] Verified saved displayName:', savedName);
    return c.json({ displayName: newDisplayName });
  }

  return c.json({ displayName });
});

app.post('/me/displayName', async (c) => {
  const userId = getCookie(c, '_bsid');
  if (!userId) {
    throw new HTTPException(403, { message: 'Missing userId' });
  }

  console.log('[POST /me/displayName] Request from userId:', userId);
  const body = await c.req.json();
  console.log('[POST /me/displayName] Request body:', body);

  if (!body.displayName) {
    throw new HTTPException(400, { message: 'Missing displayName' });
  }

  await userRepository.updateDisplayName(userId, body.displayName);
  const savedName = await userRepository.getDisplayName(userId);
  console.log('[POST /me/displayName] Verified saved displayName:', savedName);

  const room = await roomService.getRoomByParticipant(userId);
  if (room) {
    const participants = await roomService.getParticipants(room.id);
    io.to(room.id).emit('participantsUpdated', { participants });
  }

  return c.json({ success: true });
});

app.get('/', (c) => {
  return c.text('Hello Hono!');
});
