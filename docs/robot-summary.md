# Breakout Shuffler - System State

## Application Overview

A real-time application that enables hosts to create rooms and participants to join those rooms, built with:

- Client: React with Socket.IO client
- Server: Node.js with Socket.IO for real-time communication
  - Data Store: Redis for room and participant data
- Shared: Common utilities package (`@breakout-shuffler/shared`) used by both client and server

All packages use ESM (ECMAScript Modules) with `"type": "module"` in package.json.

## Current Architecture

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
       - Liveliness tracking (`lastLivelinessUpdateAt` field, `updateLiveliness`, `getLiveliness` methods)

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
       - `participantsUpdated` - broadcasts participant list updates (now includes liveliness data)
       - `nudgeHost` - manages host notifications
        - `updateLiveliness` - handles client liveliness pings (sent by non-host participants)

### Client-Side Components

1. **State Management**
   - **XState Machines**
     - State machines for managing complex UI states
     - Defined in `apps/client/app/machines/` directory
     - Current machines:
       - `roomMachine`: Manages room state and interactions
         - States:
           - idle: Initial state, shows join form
           - checking: Validates if user is already in room
           - joining: Handles room join API call
           - waitingForSocket: Establishes socket connection
           - joined: Manages room participation
             - waiting: Default state, configuring groups
             - active: Breakout session in progress
         - Features:
           - Room restoration with CHECK_ROOM event
           - Group assignment tracking
           - Breakout session controls (start/end/abort)
         - Technical details:
           - Uses fromPromise for API calls
           - Nested state machines for complex flows
           - Automatic state transitions based on room updates
           - Type-safe event handling
           - Proper error management
   - **Jotai Atoms**
     - Used for simpler global state (e.g., display names)
     - Atoms with listeners for state requiring side effects
     - Defined in `apps/client/app/atoms/` directory

2. **Socket Module (`apps/client/app/lib/socket.ts`)**
   - Exports singleton socket instance for the app
   - Configures Socket.IO client connection

3. **Cookie Management**
   - Uses react-cookie for user identification
   - Key cookies:
     - `_bsid`: Breakout Shuffler ID cookie
   - Cookie configuration:
     - Domain: Uses VITE_COOKIE_DOMAIN env var with fallback to '.breakout.local'
     - Secure: Enabled in production
     - Path: '/'

4. **Display Name Management**
   - Display names stored in Redis using UserRepository
   - HTTP endpoints for display name operations:
     - GET /me/displayName: Fetches user's display name, generates if not exists
     - POST /me/displayName: Updates user's display name
   - Client-side state management:
     - Uses Jotai atom for centralized display name state
     - Initializes display name on app load
     - Updates trigger real-time participant list updates
   - Display names persisted across sessions
   - Automatic random name generation for new users

5. **Room Component (`apps/client/app/routes/room.tsx`)**
   - Handles room joining flow
   - Manages room state and participant interactions

6. **LivelinessIndicator Component (`apps/client/app/components/LivelinessIndicator.tsx`)**
   - Displays a colored circle indicating user liveliness based on `lastLivelinessUpdateAt`.
   - Color codes: Green (<10s), Yellow (<30s), Orange (<1m), Red (<2m), Black (>=2m or unknown).

7. **DisplayName Component (`apps/client/app/components/DisplayName.tsx`)**
   - Integrates the `LivelinessIndicator` component to show user status.
   - Takes an `isHost` prop to conditionally display the indicator (only for host view, excluding self).
   - Uses `tailwind-merge` for dynamic class management.
   - Enhanced current user identification with "this is you!" text.
   - Removed legacy health tracking system.

8. **UserList Component (`apps/client/app/components/UserList.tsx`)**
   - Displays room participants, including liveliness status via `DisplayName`.
   - **Non-Hosts:** Send `updateLiveliness` event every 10 seconds.
   - **Hosts:** Poll `GET /rooms/:id/participants` endpoint every 5 seconds to update participant list and liveliness status.
   - Updates participant list via `participantsUpdated` socket event (e.g., on join/leave).
   - Passes `isHost` prop to `DisplayName`.
   - Shows current user with "(you)" indicator.
   - Debug features:
     - Debug Mode: Toggleable via cookie in the top bar menu
     - Ping: Test connection with other participants
     - Nudge Host: Allow participants to notify host (non-host only)
     - Add Dummy Participants (when debug mode enabled):
       - Host-only controls to add 1 or 10 dummy participants for testing
       - Dummy participants get random names with "(dummy)" suffix

9. **TopBar Component (`apps/client/app/components/TopBar.tsx`)**
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
3. Server updates participant's initial liveliness timestamp (`updateLiveliness`)
4. Socket connection established for real-time updates
5. Participant list broadcast to all room members

### HTTP Endpoints
1. **Room Management**
   - `GET /rooms` - List all rooms
   - `POST /rooms` - Create a new room
   - `GET /rooms/:id` - Get room details
   - `GET /rooms/:id/participants` - Get list of room participants with liveliness data
   - `POST /rooms/:id/join` - Join a room
   - `POST /rooms/:id/me` - Check if current user is in room

2. **User Management**
   - `GET /me/displayName` - Get current user's display name
   - `POST /me/displayName` - Update current user's display name
   - `GET /host` - Get host's current room

### Group System

1. **Group Allocation**
   - Two allocation modes:
     - Group Size: Specify desired size per group
     - Number of Groups: Specify total number of groups
   - Algorithm handles remainders intelligently:
     - Redistributes 1-2 remaining participants across existing groups
     - Creates new group for larger remainders
   - Examples:
     - 21 participants with size 4 creates 4,4,4,3,3,3 groups
     - 10 participants in 3 groups creates 4,3,3 groups
   - Real-time preview of group distribution

2. **Room States**
   - 'waiting': Initial state, host configures groups
   - 'active': Breakout session in progress
   - State persists across page reloads

3. **Host Controls**
   - "Breakout!" button to start session
   - "End" button to conclude normally
   - "Abort" button for early termination

4. **Participant Experience**
   - See assigned group number during active state
   - State persists across page reloads
   - Simple, clear group assignment display

### Host Controls
   - Click participant to show action modal
   - Nudge functionality: Creates popup on user's screen
   - Kick functionality: Removes user from room (can rejoin)

## Technical Details

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
  - lastLivelinessUpdateAt: string (ISO 8601 timestamp)

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
'debugAddDummyParticipants': { roomId: string, count: number }
'nudgeHost': void
'clearNudges': void
'getNudges': void
 'updateLiveliness': void // Non-host clients send this periodically
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
