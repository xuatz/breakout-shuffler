# Group Management Feature Architecture

## Feature Overview

This document describes the architecture of the group management feature that allows admins to manage group assignments during active breakout sessions.

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         Host Interface                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Waiting State (Before Breakout)            │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  • Group Size/Count Configuration                       │   │
│  │  • UserList Component (all participants)                │   │
│  │  • "Breakout!" Button                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            ▼                                    │
│                     [Click "Breakout!"]                         │
│                            ▼                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Active State (During Breakout)             │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │ GroupManagement Component                        │   │   │
│  │  ├──────────────────────────────────────────────────┤   │   │
│  │  │  Unassigned (if any)                             │   │   │
│  │  │  • Participant A                                 │   │   │
│  │  │    [Click to show action modal]                  │   │   │
│  │  ├──────────────────────────────────────────────────┤   │   │
│  │  │  Group 1 (3)                                     │   │   │
│  │  │  • Participant B  ◄── Click opens modal          │   │   │
│  │  │  • Participant C                                 │   │   │
│  │  │  • Participant D                                 │   │   │
│  │  ├──────────────────────────────────────────────────┤   │   │
│  │  │  Group 2 (2)                                     │   │   │
│  │  │  • Participant E                                 │   │   │
│  │  │  • Participant F                                 │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │                                                          │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │ HostActionModal (when participant clicked)       │   │   │
│  │  ├──────────────────────────────────────────────────┤   │   │
│  │  │  [Nudge User]                                    │   │   │
│  │  │  Move to Group:                                  │   │   │
│  │  │  [Group 1] ◄── Current (disabled)                │   │   │
│  │  │  [Group 2]                                       │   │   │
│  │  │  [Kick User]                                     │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │                                                          │   │
│  │  • "End" Button                                          │   │
│  │  • "Abort" Button                                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Socket Event Flow

### Scenario 1: Host Moves User Between Groups

```
┌──────────┐                    ┌──────────┐                    ┌──────────┐
│   Host   │                    │  Server  │                    │Participant│
│  Client  │                    │          │                    │  Clients  │
└────┬─────┘                    └────┬─────┘                    └────┬─────┘
     │                               │                               │
     │  moveUserToGroup              │                               │
     │  {roomId, userId,             │                               │
     │   targetGroupId}               │                               │
     ├──────────────────────────────>│                               │
     │                               │                               │
     │                               │ 1. Validate host permission   │
     │                               │ 2. Update room groups in Redis│
     │                               │ 3. Broadcast to all clients   │
     │                               │                               │
     │      roomStateUpdated         │      roomStateUpdated         │
     │      {state, groups}          │      {state, groups}          │
     │<──────────────────────────────┤──────────────────────────────>│
     │                               │                               │
     │  UI updates:                  │                               │  UI updates:
     │  • GroupManagement            │                               │  • Group number
     │    shows new groups           │                               │    updates
     │                               │                               │
```

### Scenario 2: Late Joiner During Active Breakout

```
┌──────────┐                    ┌──────────┐                    ┌──────────┐
│   Late   │                    │  Server  │                    │ Existing │
│  Joiner  │                    │          │                    │  Clients │
└────┬─────┘                    └────┬─────┘                    └────┬─────┘
     │                               │                               │
     │  POST /rooms/:id/join         │                               │
     ├──────────────────────────────>│                               │
     │                               │                               │
     │                               │ 1. Add participant to room    │
     │                               │ 2. Check room state = 'active'│
     │                               │ 3. Find smallest group        │
     │                               │ 4. Add user to that group     │
     │                               │ 5. Update room in Redis       │
     │                               │                               │
     │                               │                               │
     │  joinRoom (socket)            │                               │
     ├──────────────────────────────>│                               │
     │                               │                               │
     │      joinedRoom               │                               │
     │<──────────────────────────────┤                               │
     │                               │                               │
     │                               │  participantsUpdated          │
     │                               ├──────────────────────────────>│
     │  roomStateUpdated             │  roomStateUpdated             │
     │  {state: 'active',            │  {state: 'active',            │
     │   groups: {...}}              │   groups: {...}}              │
     │<──────────────────────────────┼──────────────────────────────>│
     │                               │                               │
     │  UI shows:                    │                               │  UI shows:
     │  "You are in Group X"         │                               │  Updated groups
     │                               │                               │
```

## Component Hierarchy

```
host.tsx
├── ErrorMessage (if error)
├── QR Code & Room Link
├── [state === 'waiting']
│   ├── Group Configuration Controls
│   │   ├── Mode Toggle (size/count)
│   │   ├── Input Field
│   │   └── Distribution Preview
│   ├── "Breakout!" Button
│   └── UserList (all participants)
│
└── [state === 'active']
    ├── "You are in Group X" (if host is in a group)
    ├── End/Abort Buttons
    └── GroupManagement ◄── NEW COMPONENT
        ├── Unassigned Section (conditional)
        │   └── DisplayName (clickable)
        ├── Group Sections (for each group)
        │   ├── Group Header (e.g., "Group 1 (3)")
        │   └── DisplayName (clickable)
        └── HostActionModal (when user clicked)
            ├── Nudge User Button
            ├── Move to Group Buttons (for each group)
            └── Kick User Button
```

## Backend Architecture

```
SocketService
├── moveUserToGroup handler
│   ├── 1. Validate host permission
│   ├── 2. Call RoomService.moveUserToGroup()
│   └── 3. Broadcast roomStateUpdated
│
└── joinRoom handler
    ├── 1. Call RoomService.joinRoom()
    ├── 2. Broadcast participantsUpdated
    └── 3. Broadcast roomStateUpdated (includes auto-assignment)

RoomService
├── moveUserToGroup(roomId, userId, targetGroupId)
│   ├── 1. Validate room exists and is active
│   ├── 2. Remove user from current group
│   ├── 3. Add user to target group
│   └── 4. Update room in repository
│
└── joinRoom(roomId, userId)
    ├── 1. Add participant to room
    ├── 2. If room.state === 'active':
    │   ├── a. Find smallest group
    │   ├── b. Add user to that group
    │   └── c. Update room in repository
    └── 3. Return success

RoomRepository
└── updateRoom(roomId, room)
    └── Persist room object (including groups) to Redis
```

## Redis Data Structure

```
room:{roomId} (hash)
├── id: string
├── hostId: string
├── createdAt: Date
├── state: 'waiting' | 'active'
└── groups: JSON string
    {
      "0": ["user-1", "user-2", "user-3"],
      "1": ["user-4", "user-5"],
      "2": ["user-6"]
    }

room:{roomId}:groups (set)
├── "0"
├── "1"
└── "2"

room:{roomId}:group:{groupId} (set)
├── "user-1"
├── "user-2"
└── "user-3"
```

## State Machine Integration

The feature integrates with the existing XState room machine:

```
roomMachine
└── joined (compound state)
    ├── waiting
    │   └── START_BREAKOUT → active
    └── active
        ├── ROOM_BREAKOUT_ACTIVE (stores groups in context)
        ├── END_BREAKOUT → waiting
        └── ABORT_BREAKOUT → waiting
```

When `roomStateUpdated` socket event is received with `state: 'active'`:
1. Machine transitions to `.active` state
2. Stores `groups` in machine context
3. UI re-renders with GroupManagement component
4. Each participant can find their group by checking which group contains their userId

## Security Considerations

1. **Host-Only Actions**: All group management actions validate that the requester is the host
2. **Room State Validation**: Moving users only allowed when room state is 'active'
3. **User Existence**: System handles users not in any group gracefully
4. **Concurrent Updates**: Redis atomic operations ensure consistency

## Performance Considerations

1. **Real-time Updates**: Socket.io broadcasts ensure all clients see changes immediately
2. **Single-Pass Iteration**: Group size calculation optimized to single loop
3. **Minimal Re-renders**: React components only re-render when groups change
4. **No Polling**: All updates driven by socket events, no need for polling

## Future Enhancements

1. **Drag and Drop**: Allow dragging users between groups instead of modal
2. **Bulk Operations**: Move multiple users at once
3. **Group Naming**: Allow custom names for groups (not just numbers)
4. **Visual Feedback**: Toast notification when user's group changes
5. **Undo/Redo**: Allow host to undo recent group changes
6. **Group Templates**: Save and reuse group configurations
