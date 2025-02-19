# Development Journal

## 20250219 part 2 - xz - feat: implement breakout room functionality

Added breakout room functionality with the following features:

1. Group Allocation:
   - Two modes: Group Size and Number of Groups
   - Real-time preview of group distribution
   - Server-side random participant assignment
   - Intelligent handling of uneven distributions

2. Room State Management:
   - Added 'waiting' and 'active' states
   - State persists across page reloads
   - Enhanced session restoration

3. Host Controls:
   - "Breakout!" button to start session
   - "End" and "Abort" buttons for session control
   - Real-time group distribution preview

4. Participant Experience:
   - Clear group assignment display
   - State persists across page reloads

Changes made:
- Added group distribution algorithm with test suite
- Created activeRoom atom for state management
- Updated host screen with group allocation UI
- Enhanced room component to show group assignments
- Added socket events for breakout control
- Updated documentation

Future considerations:
- Handle late-joining participants (purgatory area)
- Different UIs for host/participants in active state
- Group naming/labeling features

## 20250219 - xz - feat(robot): add group allocation UI and algorithm

Added a new feature to the host screen that allows hosts to organize participants into groups using two different modes:

1. Group Size Mode:
   - Host specifies the desired size for each group
   - Algorithm optimally distributes participants, handling remainders intelligently
   - Example: With 21 participants and group size 4, creates 4,4,4,3,3,3 groups

2. Number of Groups Mode:
   - Host specifies the total number of groups desired
   - Participants are distributed evenly across groups
   - Example: With 10 participants and 3 groups, creates 4,3,3 groups

Changes made:
- Created groupDistribution.ts with algorithm for both modes
- Added comprehensive test suite in groupDistribution.test.ts
- Updated host screen UI with mode toggle and group size/count input
- Added real-time preview of group distribution
- Updated documentation in robot-summary.md

Next steps:
- Implement actual group assignment functionality
- Add persistence for group settings
- Consider adding group naming/labeling features

## 20250219 - xz - feat(robot): tweak displayName management strategy

- Moved display name operations to HTTP endpoints:
  - GET /me/displayName: Fetches or generates display name
  - POST /me/displayName: Updates display name
- Improved Redis operations:
  - Enhanced BaseRepository with better hash field handling
  - Added verification of saved data
- Centralized state management:
  - Created displayNameAtom for global state
  - Initialize in root.tsx
  - Share across components
- Added real-time updates:
  - Display name changes trigger participant list updates
  - Removed socket events in favor of HTTP + Jotai
- Updated documentation:
  - Added HTTP endpoint conventions
  - Updated state management patterns
  - Revised socket event list

## 20250218 part 2 - xz - feat(robot): add room session restoration and standardize error handling

- Added ErrorMessage component for consistent error display across components
- Added restoreUserRoom functionality in room.tsx to handle page refresh scenarios
- Standardized socket event handling in host.tsx by moving event listeners to useEffect
- Improved error handling consistency between host.tsx and room.tsx
- Updated code to follow established patterns for error display and socket event handling

## 20250218 - xz - refactor(robot): extract Redis operations into repository layer

- Created a new repository layer to handle Redis operations:

  - BaseRepository: Common Redis operations (hash, set operations)
  - RoomRepository: Room data persistence
  - UserRepository: User data and relationships
  - NudgeRepository: Nudge tracking and history

- Updated services to use repositories:

  - RoomService now uses RoomRepository and UserRepository
  - SocketService now uses RoomService, UserRepository, and NudgeRepository

- Benefits:
  - Better separation of concerns
  - More maintainable Redis operations
  - Clearer data access patterns
  - Consistent Redis key naming and data structure
  - Easier to test (can mock repositories)

## 20250216 - xz - feat(robot): host nudging

### Overview

Implemented a feature allowing participants to nudge the host, with visual feedback and persistent tracking.

### Key Implementations

1. Server-side Changes:

   - Added Redis hash `host_nudges:{roomId}` to store nudge data
   - Implemented socket events:
     - `nudgeHost`: Updates nudge count and broadcasts to room
     - `clearNudges`: Allows host to clear nudge history
     - `getNudges`: Retrieves current nudge state

2. Client-side Changes:

   - Added Jotai state management with atomWithListeners
   - Created Modal components:
     - Base Modal with click-outside behavior
     - NudgeModal for displaying nudge history
   - Enhanced TopBar:
     - Added shake animation for nudge notifications
     - Added nudge count in menu
     - Integrated modal for viewing nudge history

3. UI/UX Improvements:
   - Visual feedback through shake animation
   - Organized nudge history by most recent
   - Clear all functionality for hosts
   - Persistent nudge tracking between sessions

### Next Steps

- Consider adding notification sounds (optional)

## 20250215 part 2 - xz - feat: add top bar with display name management

### UI Implementation

1. Added sticky top bar:
   - User icon showing first letter of display name
   - Click to open name change dialog
   - Dark mode support with consistent styling

### Display Name Updates

1. Client-side changes:

   - Added name change dialog with modal overlay
   - Real-time updates to all participants
   - Persists changes to cookie

2. Server-side changes:
   - Added updateDisplayName socket event
   - Updates Redis user:{userId} hash
   - Broadcasts changes to room participants
   - Added getRoomByParticipant for room lookup

## 20250215 - xz - feat: implement user display names

### Display Name Management

1. Client-side implementation:
   - Generate random names with adjective + noun + number pattern
   - Store displayName in cookie alongside \_bsid
   - Allow users to modify name when joining room
   - Persist name changes to cookie

### Data Storage

1. Redis implementation:
   - Store user display names in `user:{userId}` hash
   - Display names persist across server restarts
   - Names are room-independent (consistent across rooms)

### Technical Decisions

1. Cookie-based storage:
   - Display names stored in \_displayName cookie
   - Generated on first visit
   - Updated when user changes name
2. Name synchronization:
   - Display name included in joinRoom event
   - Participants list includes display names
   - Real-time updates via participantsUpdated event

## 20250214 - xz - feat: implement room joining and real-time participant tracking

### Room Management

1. Implemented room joining flow:
   - HTTP POST to join room
   - Socket connection with room ID
   - Real-time participant list updates
2. Added user identification:
   - Using \_bsid cookie for consistent user tracking
   - Server extracts user ID from cookie headers
   - Client shows "(you)" indicator in participant list

### Socket Architecture

1. Established socket event patterns:
   - 'joinRoom' - handles room joining with user validation
   - 'participantsUpdated' - broadcasts participant list changes
   - 'debugPing' - monitors client connectivity
2. Client tracking:
   - Maintains clientMap for socket-user associations
   - Handles client registration and disconnection
   - Room-specific event broadcasting

### Technical Decisions

1. Cookie-based user identification:
   - Consistent across HTTP and Socket.IO
   - No need for separate authentication flow
2. Real-time updates:
   - Room-specific broadcasts using socket.to(roomId)
   - Participant list synchronized across all room members
3. Debug features:
   - Prefixed with 'debug' for clarity
   - Room-scoped to avoid cross-room interference

### Todo 1

I need to implement something like `restoreHostRoom` but for the normal participants instead.
I may also want to consider to rename the function name :thinking:

### Todo 2

I should finish up this last feature to wrap up phase 1

> Assign a random name to each user upon joining, with the option to rename themselves.

## 20250104 - xz

I'm still on phase one. But a lot of the features are pretty much implemented now, just pending some fine tuning.

### Todo 1

For example, I think while the server should persist some information such as rooms created and who was the owner. it shouldn't contain any information about the users, since this state is entirely dependent on socket.io, so let's use that instead (TODO).

### Todo 2

I think we can store some basic information about the users
such as displayName in redis. So that the names can persist
across server restart/crash. Some code change is required in
both client and server, for example:

1. when user sends `registerClient` message, we should
   probably take the chance to give the user a randomly
   generated name.
   1. to keep things simple, im thinking to append a 3 digit
      random number to reduce hash collision
2. but then we will allow the users to easily rename themselves
   haven't decide how i will do this tho
