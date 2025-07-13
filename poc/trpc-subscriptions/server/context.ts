import { CreateHTTPContextOptions } from '@trpc/server/adapters/standalone';
import { CreateWSSContextFnOptions } from '@trpc/server/adapters/ws';
import { IncomingMessage } from 'http';
import { v4 as uuidv4 } from 'uuid';

// Store client sessions
export const clientSessions = new Map<string, {
  sessionId: string;
  userId: string;
  lastSeen: Date;
  connectionCount: number;
}>();

// Clean up old sessions periodically
setInterval(() => {
  const now = new Date();
  const timeout = 30 * 60 * 1000; // 30 minutes
  
  for (const [sessionId, session] of clientSessions.entries()) {
    if (now.getTime() - session.lastSeen.getTime() > timeout) {
      clientSessions.delete(sessionId);
      console.log(`Cleaned up session ${sessionId} for user ${session.userId}`);
    }
  }
}, 60 * 1000); // Run every minute

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  
  return Object.fromEntries(
    cookieHeader.split('; ').map(cookie => {
      const [name, value] = cookie.split('=');
      return [name, decodeURIComponent(value || '')];
    })
  );
}

function getOrCreateSessionId(req: IncomingMessage): { sessionId: string; isNew: boolean } {
  const cookies = parseCookies(req.headers.cookie);
  const existingSessionId = cookies['trpc-session-id'];
  
  if (existingSessionId && clientSessions.has(existingSessionId)) {
    return { sessionId: existingSessionId, isNew: false };
  }
  
  const newSessionId = uuidv4();
  return { sessionId: newSessionId, isNew: true };
}

export function createContext(
  opts: CreateHTTPContextOptions | CreateWSSContextFnOptions
) {
  const req = 'req' in opts ? opts.req : opts.info.req;
  const res = 'res' in opts ? opts.res : null;
  
  // Get or create session ID
  const { sessionId, isNew } = getOrCreateSessionId(req);
  
  // Get user ID from cookie (mimicking the existing auth pattern)
  const cookies = parseCookies(req.headers.cookie);
  const userId = cookies['userId'] || `anonymous-${uuidv4()}`;
  
  // Update or create session
  const existingSession = clientSessions.get(sessionId);
  if (existingSession) {
    existingSession.lastSeen = new Date();
    existingSession.connectionCount++;
  } else {
    clientSessions.set(sessionId, {
      sessionId,
      userId,
      lastSeen: new Date(),
      connectionCount: 1
    });
  }
  
  // Set session cookie for HTTP responses
  if (res && isNew) {
    res.setHeader('Set-Cookie', `trpc-session-id=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`);
  }
  
  return {
    sessionId,
    userId,
    isNewSession: isNew,
    connectionCount: clientSessions.get(sessionId)?.connectionCount || 1,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;