# Development Journal

## 20240224 - xz - feat(robot): add client liveliness tracking with visual feedback

Added client liveliness tracking feature with the following components:

1. Server-side changes:
   - Enhanced UserRepository with liveliness tracking
   - Simplified health check response in socket service
   - Real-time liveliness updates for all participants

2. Client-side changes:
   - New DisplayName component with visual liveliness indicator
   - Width-based health bar with smooth animations
   - Color-coded status feedback (green/yellow/red)
   - Layered design with background transitions

3. Technical improvements:
   - Automatic health checks every 30 seconds
   - Smooth decay animation between health states
   - Real-time updates for all room participants
   - Host controls for participant management (nudge/kick)

## 20250219 - xz - feat: implement breakout room functionality

### Features Implemented
1. Group Allocation
   - Two modes: Group Size and Number of Groups
   - Real-time preview of group distribution
   - Server-side random participant assignment
   - Intelligent handling of uneven distributions

2. Room State Management
   - Added 'waiting' and 'active' states
   - State persists across page reloads
   - Enhanced session restoration

3. Host Controls
   - "Breakout!" button to start session
   - "End" and "Abort" buttons for session control
   - Real-time group distribution preview

4. Participant Experience
   - Clear group assignment display
   - State persists across page reloads

### Technical Changes
- Added group distribution algorithm with test suite
- Created activeRoom atom for state management
- Updated host screen with group allocation UI
- Enhanced room component to show group assignments
- Added socket events for breakout control
- Updated documentation

### Future Considerations
- Handle late-joining participants (purgatory area)
- Different UIs for host/participants in active state
- Group naming/labeling features

## 20250219 - xz - feat(robot): add group allocation UI and algorithm

### Features Implemented
1. Group Size Mode
   - Host specifies the desired size for each group
   - Algorithm optimally distributes participants, handling remainders intelligently
   - Example: With 21 participants and group size 4, creates 4,4,4,3,3,3 groups

2. Number of Groups Mode
   - Host specifies the total number of groups desired
   - Participants are distributed evenly across groups
   - Example: With 10 participants and 3 groups, creates 4,3,3 groups

### Technical Changes
- Created groupDistribution.ts with algorithm for both modes
- Added comprehensive test suite in groupDistribution.test.ts
- Updated host screen UI with mode toggle and group size/count input
- Added real-time preview of group distribution
- Updated documentation in robot-summary.md

### Next Steps
- Implement actual group assignment functionality
- Add persistence for group settings
- Consider adding group naming/labeling features

## 20250219 - xz - feat(robot): tweak displayName management strategy

### Technical Changes
1. HTTP Endpoints
   - GET /me/displayName: Fetches or generates display name
   - POST /me/displayName: Updates display name

2. Redis Operations
   - Enhanced BaseRepository with better hash field handling
   - Added verification of saved data

3. State Management
   - Created displayNameAtom for global state
   - Initialize in root.tsx
   - Share across components

4. Real-time Updates
   - Display name changes trigger participant list updates
   - Removed socket events in favor of HTTP + Jotai

### Documentation Updates
- Added HTTP endpoint conventions
- Updated state management patterns
- Revised socket event list

## 20250218 - xz - feat(robot): add room session restoration and standardize error handling

### Technical Changes
- Added ErrorMessage component for consistent error display
- Added restoreUserRoom functionality in room.tsx for page refresh scenarios
- Standardized socket event handling in host.tsx
- Improved error handling consistency between host.tsx and room.tsx
- Updated code to follow established patterns

## 20250218 - xz - refactor(robot): extract Redis operations into repository layer

### Repository Layer Implementation
1. Base Components
   - BaseRepository: Common Redis operations (hash, set operations)
   - RoomRepository: Room data persistence
   - UserRepository: User data and relationships
   - NudgeRepository: Nudge tracking and history

2. Service Updates
   - RoomService now uses RoomRepository and UserRepository
   - SocketService now uses RoomService, UserRepository, and NudgeRepository

### Benefits
- Better separation of concerns
- More maintainable Redis operations
- Clearer data access patterns
- Consistent Redis key naming and data structure
- Easier to test (can mock repositories)

## 20250216 - xz - feat(robot): host nudging

### Server-side Changes
- Added Redis hash `host_nudges:{roomId}` for nudge data
- Implemented socket events:
  - `nudgeHost`: Updates nudge count and broadcasts to room
  - `clearNudges`: Allows host to clear nudge history
  - `getNudges`: Retrieves current nudge state

### Client-side Changes
- Added Jotai state management with atomWithListeners
- Created Modal components:
  - Base Modal with click-outside behavior
  - NudgeModal for displaying nudge history
- Enhanced TopBar:
  - Added shake animation for nudge notifications
  - Added nudge count in menu
  - Integrated modal for viewing nudge history

### UI/UX Improvements
- Visual feedback through shake animation
- Organized nudge history by most recent
- Clear all functionality for hosts
- Persistent nudge tracking between sessions

### Future Considerations
- Consider adding notification sounds (optional)

## 20250215 - xz - feat: add top bar with display name management

### UI Implementation
- Added sticky top bar with user icon showing first letter of display name
- Click to open name change dialog
- Dark mode support with consistent styling

### Technical Changes
1. Client-side
   - Added name change dialog with modal overlay
   - Real-time updates to all participants
   - Persists changes to cookie

2. Server-side
   - Added updateDisplayName socket event
   - Updates Redis user:{userId} hash
   - Broadcasts changes to room participants
   - Added getRoomByParticipant for room lookup

## 20250215 - xz - feat: implement user display names

### Display Name Management
1. Client Implementation
   - Generate random names with adjective + noun + number pattern
   - Store displayName in cookie alongside _bsid
   - Allow users to modify name when joining room
   - Persist name changes to cookie

2. Data Storage
   - Store user display names in `user:{userId}` hash
   - Display names persist across server restarts
   - Names are room-independent (consistent across rooms)

### Technical Decisions
1. Cookie-based Storage
   - Display names stored in _displayName cookie
   - Generated on first visit
   - Updated when user changes name

2. Name Synchronization
   - Display name included in joinRoom event
   - Participants list includes display names
   - Real-time updates via participantsUpdated event

## 20250214 - xz - feat: implement room joining and real-time participant tracking

### Room Management
1. Room Joining Flow
   - HTTP POST to join room
   - Socket connection with room ID
   - Real-time participant list updates

2. User Identification
   - Using _bsid cookie for consistent user tracking
   - Server extracts user ID from cookie headers
   - Client shows "(you)" indicator in participant list

### Socket Architecture
1. Event Patterns
   - 'joinRoom' - handles room joining with user validation
   - 'participantsUpdated' - broadcasts participant list changes
   - 'debugPing' - monitors client connectivity

2. Client Tracking
   - Maintains clientMap for socket-user associations
   - Handles client registration and disconnection
   - Room-specific event broadcasting

### Technical Decisions
1. Cookie-based User Identification
   - Consistent across HTTP and Socket.IO
   - No need for separate authentication flow

2. Real-time Updates
   - Room-specific broadcasts using socket.to(roomId)
   - Participant list synchronized across all room members

3. Debug Features
   - Prefixed with 'debug' for clarity
   - Room-scoped to avoid cross-room interference

### Todo
1. Implement restoreUserRoom for normal participants
2. Consider renaming function for clarity

## 20250104 - xz - chore: document phase one progress and todos

### Current Status
- Phase one features mostly implemented
- Pending fine-tuning and improvements

### Todo
1. Server-side State Management
   - Review room persistence strategy
   - Move user state to socket.io
   - Remove unnecessary user information from server

2. User Information Storage
   - Implement Redis storage for basic user info (e.g., displayName)
   - Add random name generation during client registration
   - Enable user self-rename functionality
   - Ensure persistence across server restarts

