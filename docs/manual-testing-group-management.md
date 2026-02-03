# Manual Testing Guide: Group Management During Active Breakout

This document provides step-by-step instructions for manually testing the new group management features that allow admins to add/move/edit users into groups even after a breakout session has started.

## Prerequisites

1. Start the development environment:
   ```bash
   docker compose up -d
   ```
2. Access the application at https://client.breakout.local
3. You'll need at least 2 browser windows/tabs (one for host, one for participant)

## Test Scenario 1: Moving Users Between Groups During Active Breakout

### Setup
1. **Host Window**: Create a new room
2. **Participant Window 1**: Join the room with name "Alice"
3. **Participant Window 2**: Join the room with name "Bob"
4. **Participant Window 3**: Join the room with name "Charlie"
5. **Participant Window 4**: Join the room with name "Diana"
6. **Host Window**: Set group size to 2 and click "Breakout!"

### Expected State After Breakout
- Host should see group assignment UI with 2 groups
- Each group should have 2 participants
- Participants should see their group number displayed

### Test Steps
1. **Host Window**: Click on "Alice" in Group 1
2. **Host Window**: In the modal, click "Move to Group 2"
3. **Expected Result**: 
   - Alice should immediately move from Group 1 to Group 2
   - Host should see updated group lists
   - Alice's window should show "You are in Group 2" instead of Group 1
   - All other participants should see the updated group count

### Success Criteria
- ✅ Modal shows "Move to Group" buttons for all groups
- ✅ Current group is disabled/marked as "(Current)"
- ✅ After moving, group lists update immediately
- ✅ All participants see the change in real-time
- ✅ No errors in console

## Test Scenario 2: Late-Joining Participant During Active Breakout

### Setup
1. Continue from Scenario 1 or start fresh with 4 participants in active breakout
2. Current state: 2 groups with participants distributed

### Test Steps
1. **New Participant Window**: Open a new browser window/tab
2. **New Participant**: Join the same room with name "Eve"
3. **Expected Result**:
   - Eve should be automatically assigned to the smallest group
   - Host should see Eve appear in one of the groups
   - Eve's window should show "You are in Group X"
   - All participants should see updated participant count

### Success Criteria
- ✅ Late joiner is automatically assigned to smallest group
- ✅ If groups are equal size, late joiner goes to first smallest group found
- ✅ Late joiner sees their group assignment immediately
- ✅ Host sees late joiner in group management UI
- ✅ All participants can see the late joiner in their participant list

## Test Scenario 3: Unassigned Participants Section

### Setup
1. Start with an active breakout session
2. Use debug mode to add a dummy participant during active state OR
3. Manually create a scenario where moveUserToGroup is called with a user not in any group

### Test Steps
1. **Host Window**: If a participant is not in any group, they should appear in "Unassigned" section
2. **Host Window**: Click on unassigned participant
3. **Host Window**: Move them to any group
4. **Expected Result**:
   - Participant moves from "Unassigned" to selected group
   - "Unassigned" section disappears if empty

### Success Criteria
- ✅ Unassigned section shows when participants have no group
- ✅ Can move unassigned participants to any group
- ✅ Section disappears when all participants are assigned

## Test Scenario 4: Empty Groups After Moving Users

### Setup
1. Start with an active breakout session with 2 groups
2. Group 1 has 1 participant, Group 2 has 2 participants

### Test Steps
1. **Host Window**: Move the only participant from Group 1 to Group 2
2. **Expected Result**:
   - Group 1 should now be empty (0 participants)
   - Group 2 should have 3 participants
   - Empty group is still displayed

### Success Criteria
- ✅ Empty groups are displayed (no minimum size enforcement)
- ✅ Can still move participants into empty groups
- ✅ Group count remains accurate

## Test Scenario 5: Moving User to New Group

### Setup
1. Start with an active breakout session with 2 groups (Group 1 and Group 2)
2. Have at least 1 participant in a group

### Test Steps
1. **Host Window**: Click on a participant in Group 1
2. **Host Window**: In the modal, try to move them to "Group 3" (if that option exists)
3. **Expected Result**:
   - Currently the modal only shows existing groups
   - This scenario tests that the backend can create new groups if needed

### Success Criteria
- ✅ Backend `moveUserToGroup` can create new groups if target group doesn't exist
- ✅ UI currently limits to existing groups (which is acceptable)

## Test Scenario 6: Multiple Simultaneous Operations

### Setup
1. Start with an active breakout session with 3 participants

### Test Steps
1. **Host Window**: Move Alice to Group 2
2. **Immediately After**: New participant joins
3. **Expected Result**:
   - Both operations should complete successfully
   - No race conditions or conflicts
   - All participants see correct state

### Success Criteria
- ✅ Concurrent operations don't cause conflicts
- ✅ All participants eventually see consistent state
- ✅ No errors in console

## Test Scenario 7: Persistence Across Page Refresh

### Setup
1. Start with an active breakout session
2. Move some participants between groups

### Test Steps
1. **Host Window**: Refresh the page
2. **Expected Result**:
   - Room state should be restored
   - Group assignments should be the same as before refresh
3. **Participant Window**: Refresh the page
4. **Expected Result**:
   - Should still see correct group assignment

### Success Criteria
- ✅ Host sees correct group assignments after refresh
- ✅ Participants see correct group after refresh
- ✅ Group management UI renders correctly after refresh

## Test Scenario 8: End/Abort Breakout After Moving Users

### Setup
1. Start with an active breakout session
2. Move participants between groups

### Test Steps
1. **Host Window**: Click "End" or "Abort" button
2. **Expected Result**:
   - Room state returns to "waiting"
   - Groups are cleared
   - All participants see waiting state
   - UserList component shown instead of GroupManagement

### Success Criteria
- ✅ End/Abort still work correctly
- ✅ Groups are cleared on end/abort
- ✅ Can start a new breakout session with different groups

## Edge Cases to Test

### Edge Case 1: Single Participant Room
- Start breakout with 1 participant
- Late joiner should be added to same group or create new group

### Edge Case 2: Very Large Groups
- Use debug mode to add 20+ dummy participants
- Verify UI remains responsive
- Verify moving users between large groups works

### Edge Case 3: Moving Host
- Host can move themselves between groups
- Verify host can still see all controls after being moved

## Console Checks

During all tests, monitor browser console for:
- ❌ No error messages
- ❌ No warning messages (except pre-existing ones)
- ✅ Socket events are being sent/received correctly
- ✅ State updates are happening as expected

## Database Checks (Optional)

If you have access to Redis:
```bash
# Connect to Redis
docker exec -it breakout-shuffler-redis-1 redis-cli

# Check room data
HGETALL room:{roomId}

# Check group data
SMEMBERS room:{roomId}:groups
SMEMBERS room:{roomId}:group:0
SMEMBERS room:{roomId}:group:1
```

## Known Issues/Limitations

1. Pre-existing TypeScript errors in host.tsx (unrelated to this feature)
2. Nudge user functionality not fully implemented (shows console.log)
3. No visual notification when user's group changes (could be future enhancement)

## Reporting Issues

When reporting issues, please include:
1. Which scenario/test case failed
2. Browser console errors (if any)
3. Expected vs actual behavior
4. Steps to reproduce
5. Browser and OS information
