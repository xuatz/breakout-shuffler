import express from 'express';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { applyWSSHandler } from '@trpc/server/adapters/ws';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { appRouter } from './router.js';
import { createContext } from './context.js';

const app = express();
const PORT = 3001;

// Enable CORS
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Parse cookies middleware
app.use((req, res, next) => {
  const cookieHeader = req.headers.cookie || '';
  req.cookies = Object.fromEntries(
    cookieHeader.split('; ').map(cookie => {
      const [name, value] = cookie.split('=');
      return [name, decodeURIComponent(value || '')];
    })
  );
  next();
});

// Create tRPC express middleware
app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

const server = app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

// Create WebSocket server
const wss = new WebSocketServer({
  server,
  path: '/trpc',
});

// Apply WebSocket handler
const handler = applyWSSHandler({
  wss,
  router: appRouter,
  createContext,
});

// Cleanup on server shutdown
process.on('SIGTERM', () => {
  handler.broadcastReconnectNotification();
  wss.close();
  server.close();
});