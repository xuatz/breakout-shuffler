# Breakout Shuffler - Summary Report

## Application Overview

A real-time application that enables hosts to create rooms and participants to join those rooms, built with:

- Server: Deno with Socket.IO for real-time communication
- Client: React with Socket.IO client
- Data Store: Redis for room and participant data

## Architecture

### Server-Side Components

1. **Repository Layer**

   - **Base Repository (`apps/server/src/repositories/base.repository.ts`)**

     - Abstract base class for Redis operations
     - Common methods for hash, set operations

   - **Room Repository (`apps/server/src/repositories/room.repository.ts`)**
     - Handles room data persistence
     - Key operations:
       - Room creation and retrieval
       - Participant management
       - Room existence checks
   - **User Repository (`apps/server/src/repositories/user.repository.ts`)**

     - Manages user-related data
     - Key operations:
       - Display name management
       - User-room relationships
       - User info retrieval

   - **Nudge Repository (`apps/server/src/repositories/nudge.repository.ts`)**
     - Handles nudge functionality persistence
     - Key operations:
       - Nudge tracking and updates
       - Nudge history retrieval
       - Nudge clearing

2. **Service Layer**

   - **Room Service (`apps/server/src/services/room.service.ts`)**

     - Business logic for room operations
     - Uses RoomRepository and UserRepository
     - Key features:
       - Room creation with unique IDs
       - Room retrieval and validation
       - Participant management within rooms

   - **Socket Service (`apps/server/src/services/socket.service.ts`)**
     - Handles real-time communication
     - Uses RoomService, UserRepository, and NudgeRepository
     - Key events:
       - `joinRoom` - handles participant joining
       - `createRoom` - handles room creation
       - `participantsUpdated` - broadcasts participant list updates
       - `nudgeHost` - manages host notifications

### Client-Side Components

1. **Socket Context (`apps/client/app/context/socket.tsx`)**

   - Provides socket instance throughout the app
   - Ensures socket is always available (non-null)
   - Handles connection lifecycle

2. **Cookie Management**

   - Uses react-cookie for cookie management
   - Key cookies:
     - `_bsid`: Breakout Shuffler ID cookie
     - `_displayName`: User's display name
   - Cookie configuration:
     - Domain: Uses VITE_COOKIE_DOMAIN env var with fallback to '.breakout.local'
     - Secure: Enabled in production
     - Path: '/'

3. **Room Component (`apps/client/app/routes/room.tsx`)**

   - Handles room joining flow
   - Manages room state and participant interactions

4. **UserList Component (`apps/client/app/components/UserList.tsx`)**

   - Displays room participants
   - Updates in real-time via socket events
   - Shows current user with "(you)" indicator
   - Debug features:
     - Ping: Test connection with other participants
     - Nudge Host: Allow participants to notify host (non-host only)

5. **TopBar Component (`apps/client/app/components/TopBar.tsx`)**
   - Sticky top bar with user icon and dropdown menu
   - Shows first letter of user's display name
   - Features:
     - Display name change functionality
     - Debug menu with cookie management
     - Click-outside handling for menu dismissal
     - Nudge notifications for hosts:
       - Icon shakes when receiving nudges
       - Nudge count in dropdown menu
       - Modal view of nudge history
       - Clear all nudges functionality

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
- User display names with persistence and customization
- Host notification system with visual feedback
- Persistent nudge tracking with Redis
- Real-time nudge updates with animation

### In Progress

- Participant disconnection handling
- Room cleanup on host disconnect
- Session restoration for participants (similar to host session restoration)

### Future Improvements

- Custom room IDs (currently auto-generated)
- Enhanced participant management
- Room chat functionality
- Breakout room grouping features
- Improved error handling and user feedback

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

user_rooms:{userId} (set)
  - Set of room IDs

user:{userId} (hash)
  - displayName: string

host_nudges:{roomId} (hash)
  - userId -> {
      userId: string,
      displayName: string,
      count: number,
      lastNudge: Date
    }
```

### Socket Events

```typescript
// Server -> Client
'joinedRoom': { userId: string, roomId: string }
'participantsUpdated': { participants: User[] }
'error': { message: string }
'hostNudged': { nudges: NudgeData[] }

// Client -> Server
'joinRoom': { roomId: string, displayName: string }
'createRoom': void
'debugPing': { pingerId: string, roomId: string }
'updateDisplayName': { displayName: string }
'nudgeHost': void
'clearNudges': void
'getNudges': void
```

## CI/CD Pipeline

### Docker Configuration

- Multi-stage builds for optimized image sizes
- Production-ready configurations:
  - Client: React application served via static files
  - Server: Compiled TypeScript with Node.js runtime (port 9000)
  - Only production dependencies included in final images
  - Uses pnpm@10 for package management

### GitHub Actions Workflow

- Automated Docker image builds on push to main branch
- Builds and pushes both client and server images to GitHub Container Registry (ghcr.io)
- Uses efficient caching and multi-platform build support
- Images tagged with commit SHA and latest tags
- Images published under repository namespace (e.g., owner/repo/client, owner/repo/server)

## Next Steps

1. Implement proper error handling for edge cases
2. Add participant disconnection cleanup
3. Add room deletion when host disconnects
4. Enhance UI/UX for room management
