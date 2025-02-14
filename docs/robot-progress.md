# Breakout Shuffler - Progress Report

## Application Overview

A real-time application that enables hosts to create rooms and participants to join those rooms, built with:
- Server: Deno with Socket.IO for real-time communication
- Client: React with Socket.IO client
- Data Store: Redis for room and participant data

## Architecture

### Server-Side Components

1. **Room Service (`apps/server/src/modules/rooms/room.service.ts`)**
   - Manages room-related operations using Redis
   - Key features:
     - Room creation with unique IDs
     - Room retrieval and validation
     - Participant management within rooms
     - Redis data structure:
       - `room:{roomId}` (hash) - stores room details
       - `participants:{roomId}` (set) - stores participant IDs
       - `host_rooms:{hostId}` (set) - tracks host's room

2. **Socket Service (`apps/server/src/modules/sockets/socket.service.ts`)**
   - Handles real-time communication
   - Key events:
     - `joinRoom` - handles participant joining
     - `createRoom` - handles room creation
     - `participantsUpdated` - broadcasts participant list updates

### Client-Side Components

1. **Socket Context (`apps/client/app/context/socket.tsx`)**
   - Provides socket instance throughout the app
   - Ensures socket is always available (non-null)
   - Handles connection lifecycle

2. **Room Component (`apps/client/app/routes/room.tsx`)**
   - Handles room joining flow
   - Manages room state and participant interactions

3. **UserList Component (`apps/client/app/components/UserList.tsx`)**
   - Displays room participants
   - Updates in real-time via socket events
   - Handles participant display names (prepared for future implementation)

## Implementation Details

### Room Creation Flow
1. Host initiates room creation
2. Server generates unique room ID
3. Room details stored in Redis
4. Host automatically added as first participant

### Room Joining Flow
1. Participant makes HTTP POST request to join room
2. Server validates room and adds participant
3. Socket connection established for real-time updates
4. Participant list broadcast to all room members

### Real-time Updates
- Socket.IO events used for immediate state synchronization
- Participants receive updates when:
  - New participants join
  - Room state changes
  - (Future) Participants leave or disconnect

## Current State

### Completed Features
- Room creation with unique IDs
- Room joining via HTTP + Socket.IO
- Real-time participant list updates
- Socket context with guaranteed availability
- Basic UI components for room interaction
- Connection status monitoring via debug ping

### In Progress
- Display name implementation
- Participant disconnection handling
- Room cleanup on host disconnect

### Future Improvements
- Custom room IDs (currently auto-generated)
- Enhanced participant management
- Room chat functionality
- Breakout room grouping features

## Technical Notes

### Redis Data Structure
```
room:{roomId} (hash)
  - id: string
  - hostId: string
  - createdAt: Date

participants:{roomId} (set)
  - Set of participant IDs

host_rooms:{hostId} (set)
  - Set of room IDs (limited to one per host)
```

### Socket Events
```typescript
// Server -> Client
'joinedRoom': { userId: string, roomId: string }
'participantsUpdated': { participants: User[] }
'error': { message: string }

// Client -> Server
'joinRoom': { roomId: string, name?: string }
'createRoom': void
'debugPing': { pingerId: string, roomId: string }
```

## Next Steps

1. Implement proper error handling for edge cases
2. Add participant disconnection cleanup
3. Implement display name functionality
4. Add room deletion when host disconnects
5. Enhance UI/UX for room management
