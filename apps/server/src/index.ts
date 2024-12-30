import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Server as HTTPSServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";

const app = new Hono()

app.use('*', cors({
  origin: 'http://localhost:5173',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}))

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

const port = 9000
console.log(`Server is running on http://localhost:${port}`)

const server = serve({
  fetch: app.fetch,
  port
})

const io = new SocketIOServer(server as HTTPSServer, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  socket.emit("hello", "world");
  socket.on('chat message', (data) => {
    console.log('message: ' + JSON.stringify(data));
    socket.broadcast.emit("hello", data);
  });
});
