# tRPC Subscriptions POC - Client Reconnection Handling

This POC demonstrates how tRPC subscriptions can handle client reconnections properly, ensuring that browser reloads don't create multiple phantom connections.

## Key Features

### 1. Persistent Session Tracking
- Uses HTTP-only cookies to store a `trpc-session-id`
- Session IDs persist across page reloads
- Server tracks connection count per session
- Sessions expire after 30 minutes of inactivity

### 2. Client Identity Management
- Each client has a persistent `sessionId` (survives reloads)
- Each client has a `userId` (mimics your current auth pattern)
- Server tracks how many times a session has connected

### 3. Subscription Lifecycle
- When a client subscribes to room updates, they're added as a participant
- When the WebSocket disconnects, they're automatically removed
- Reconnections with the same session ID don't create duplicate participants

## Running the POC

1. Install dependencies:
```bash
cd poc/trpc-subscriptions
npm install
```

2. Start the development servers:
```bash
npm run dev
```

This will start:
- Server on http://localhost:3001
- Client on http://localhost:5173

## Testing Reconnection Behavior

1. **Open the app** - You'll see your session info and can join a room
2. **Join the room** - Enter a name and join
3. **Test reconnection scenarios:**
   - Click "Reload Page" - You'll reconnect with the same session ID
   - Click "Close WebSocket" - Simulates network disconnect, auto-reconnects
   - Click "Clear Session & Reload" - Creates a new session

## Key Observations

1. **Session Persistence**: The `connectionCount` increments each time you reload, but the `sessionId` remains the same
2. **No Phantom Users**: The participant list doesn't show duplicates when you reload
3. **Automatic Cleanup**: When a connection drops, the user is removed from the room
4. **Reconnection**: The WebSocket automatically reconnects with exponential backoff

## Architecture Benefits

### Compared to Socket.io:
1. **Type Safety**: Full end-to-end type safety for all events
2. **Simpler API**: No need to manage event names as strings
3. **Better DX**: Autocomplete and compile-time checking
4. **Unified Transport**: Same client for queries, mutations, and subscriptions

### Session Management:
1. **HTTP Cookie-based**: Sessions are established via HTTP before WebSocket upgrade
2. **Stateless Reconnection**: Server can identify returning clients without complex handshakes
3. **Automatic Cleanup**: Built-in session expiration and cleanup

## Migration Path from Socket.io

To migrate your existing socket events to tRPC:

1. **Replace event handlers** with tRPC procedures:
   - `socket.on('joinRoom')` → `joinRoom` mutation
   - `socket.on('startBreakout')` → `startBreakout` mutation
   
2. **Replace event emitters** with subscriptions:
   - `socket.emit('participantsUpdated')` → Return from `roomUpdates` subscription
   - `socket.emit('roomStateUpdated')` → Return from `roomUpdates` subscription

3. **Consolidate related events** into single subscriptions:
   - Multiple room-related events → Single `roomUpdates` subscription
   - The subscription can return different event types

4. **Use HTTP for one-time operations**:
   - Room creation, user kicks → Regular mutations
   - Only use subscriptions for real-time updates

## Code Structure

- `/server/context.ts` - Session management and client tracking
- `/server/router.ts` - tRPC procedures and subscriptions
- `/client/src/trpc.ts` - Client setup with reconnection
- `/client/src/App.tsx` - Demo UI showing session tracking