# Breakout Shuffler - System State

## Application Overview

A real-time application that enables hosts to create rooms and participants to join those rooms, built with:

- Client: React with Socket.IO client
- Server: Node.js with Socket.IO for real-time communication
  - Data Store: Redis for room and participant data

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
       - Liveliness tracking

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
       - `healthCheck` - manages client liveliness

### Client-Side Components

1. **Socket Context (`apps/client/app/context/socket.tsx`)**
   - Provides socket instance throughout the app
   - Ensures socket is always available (non-null)
   - Handles connection lifecycle

2. **Cookie Management**
   - Uses react-cookie for user identification
   - Key cookies:
     - `_bsid`: Breakout Shuffler ID cookie
   - Cookie configuration:
     - Domain: Uses VITE_COOKIE_DOMAIN env var with fallback to '.breakout.local'
     - Secure: Enabled in production
     - Path: '/'

3. **Display Name Management**
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

4. **Room Component (`apps/client/app/routes/room.tsx`)**
   - Handles room joining flow
   - Manages room state and participant interactions

5. **UserList Component (`apps/client/app/components/UserList.tsx`)**
   - Displays room participants
   - Updates in real-time via socket events
   - Shows current user with "(you)" indicator
   - Debug features:
     - Debug Mode: Toggleable via cookie in the top bar menu
     - Ping: Test connection with other participants
     - Nudge Host: Allow participants to notify host (non-host only)
     - Add Dummy Participants (when debug mode enabled):
       - Host-only controls to add 1 or 10 dummy participants for testing
       - Dummy participants get random names with "(dummy)" suffix

6. **TopBar Component (`apps/client/app/components/TopBar.tsx`)**
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

### Health System

1. **Client-Side Components**
   - DisplayName component with visual liveliness indicator
   - Smooth width-based health bar animation
   - Color-coded status:
     - Green (>70%): Active within 1 minute
     - Yellow (50-70%): Active within 2 minutes
     - Red (<50%): Inactive for >2 minutes

2. **Server-Side Implementation**
   - Automatic health check every 30 seconds
   - Health data stored in Redis
   - Real-time updates via Socket.IO
   - Health calculation based on last check time

3. **Host Controls**
   - Click participant to show action modal
   - Nudge functionality: Creates popup on user's screen
   - Kick functionality: Removes user from room (can rejoin)

4. **Planned Interactive Health System**
   - User actions (planned):
     - Deal 2 damage to others
     - Train to gain 1 HP
     - Heal others for 2 HP
   - Stats tracking (planned):
     - Track damage dealt
     - Track healing provided
     - Track training sessions
     - Cross-session persistence

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
  - lastHealthCheck: string  // ISO timestamp
  - health: number          // Current health points (0-100)

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
'healthUpdate': { userId: string, health: number, lastHealthCheck: string }

// Client -> Server
'joinRoom': { roomId: string, displayName: string }
'createRoom': void
'debugPing': { pingerId: string, roomId: string }
'debugAddDummyParticipants': { roomId: string, count: number }
'nudgeHost': void
'clearNudges': void
'getNudges': void
'healthCheck': void
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
