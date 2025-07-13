import { initTRPC } from '@trpc/server';
import { observable } from '@trpc/server/observable';
import { z } from 'zod';
import superjson from 'superjson';
import { Context, clientSessions } from './context.js';
import EventEmitter from 'events';

// Create tRPC instance
const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

// Event emitter for room updates
const roomEvents = new EventEmitter();

// Simple in-memory room storage
const rooms = new Map<string, {
  id: string;
  participants: Array<{
    userId: string;
    sessionId: string;
    name: string;
    joinedAt: Date;
  }>;
  messages: Array<{
    id: string;
    userId: string;
    text: string;
    timestamp: Date;
  }>;
}>();

export const appRouter = t.router({
  // Get current session info
  getSessionInfo: t.procedure.query(({ ctx }) => {
    return {
      sessionId: ctx.sessionId,
      userId: ctx.userId,
      isNewSession: ctx.isNewSession,
      connectionCount: ctx.connectionCount,
      activeSessions: clientSessions.size,
    };
  }),

  // Create or join a room
  joinRoom: t.procedure
    .input(z.object({
      roomId: z.string(),
      userName: z.string(),
    }))
    .mutation(({ ctx, input }) => {
      let room = rooms.get(input.roomId);
      
      if (!room) {
        room = {
          id: input.roomId,
          participants: [],
          messages: [],
        };
        rooms.set(input.roomId, room);
      }
      
      // Remove any existing participant with same sessionId
      room.participants = room.participants.filter(p => p.sessionId !== ctx.sessionId);
      
      // Add participant
      room.participants.push({
        userId: ctx.userId,
        sessionId: ctx.sessionId,
        name: input.userName,
        joinedAt: new Date(),
      });
      
      // Emit update
      roomEvents.emit(`room:${input.roomId}`, {
        type: 'participantJoined',
        room,
        participant: {
          userId: ctx.userId,
          sessionId: ctx.sessionId,
          name: input.userName,
        },
      });
      
      return { success: true, room };
    }),

  // Send a message
  sendMessage: t.procedure
    .input(z.object({
      roomId: z.string(),
      text: z.string(),
    }))
    .mutation(({ ctx, input }) => {
      const room = rooms.get(input.roomId);
      if (!room) {
        throw new Error('Room not found');
      }
      
      const message = {
        id: `msg-${Date.now()}`,
        userId: ctx.userId,
        text: input.text,
        timestamp: new Date(),
      };
      
      room.messages.push(message);
      
      // Emit update
      roomEvents.emit(`room:${input.roomId}`, {
        type: 'messageReceived',
        message,
      });
      
      return { success: true, message };
    }),

  // Subscribe to room updates
  roomUpdates: t.procedure
    .input(z.object({
      roomId: z.string(),
    }))
    .subscription(({ ctx, input }) => {
      return observable((emit) => {
        console.log(`New subscription from session ${ctx.sessionId} (connection #${ctx.connectionCount})`);
        
        // Send initial room state
        const room = rooms.get(input.roomId);
        if (room) {
          emit.next({
            type: 'initialState',
            room,
          });
        }
        
        // Listen for room updates
        const onRoomUpdate = (data: any) => {
          emit.next(data);
        };
        
        roomEvents.on(`room:${input.roomId}`, onRoomUpdate);
        
        // Cleanup on unsubscribe
        return () => {
          console.log(`Subscription closed for session ${ctx.sessionId}`);
          roomEvents.off(`room:${input.roomId}`, onRoomUpdate);
          
          // Remove participant when they disconnect
          const room = rooms.get(input.roomId);
          if (room) {
            room.participants = room.participants.filter(p => p.sessionId !== ctx.sessionId);
            
            // Emit participant left event
            roomEvents.emit(`room:${input.roomId}`, {
              type: 'participantLeft',
              room,
              sessionId: ctx.sessionId,
            });
          }
        };
      });
    }),

  // Debug endpoint to see all active sessions
  debugSessions: t.procedure.query(() => {
    return Array.from(clientSessions.entries()).map(([id, session]) => ({
      sessionId: id,
      userId: session.userId,
      lastSeen: session.lastSeen,
      connectionCount: session.connectionCount,
    }));
  }),
});

export type AppRouter = typeof appRouter;