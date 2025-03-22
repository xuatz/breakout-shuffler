# Project TODOs

## Bugs

### Low Priority 
- [ ] when users reconnect, sometimes a page refresh is required before the room information shows up
- [ ] (host) in a room, when the host refresh the page, the health/status bar of all participants is empty
- [ ] (participant) in a room, when the host refresh the page, the health/status bar remains but turns grey
- [ ] (participant) in a room, when the participant refresh the page, the health/status bar of the host is empty

## Short-term Tasks
- [ ] (host) nudge user feature
- [ ] (participant) UI feedback from getting kicked from host
- [x] hide "ping" button unless debug mode on
- [x] Begin XState refactoring for room.tsx - implemented basic room joining flow
- [ ] Continue XState refactoring:
  - [ ] Refactor room state management (waiting vs active)
  - [ ] Refactor socket event handling with XState

## Roadmap-derived Tasks
### Group Management
- [ ] Handle late-joining participants (purgatory area)
- [ ] Different UIs for host/participants in active state
- [ ] Group naming/labeling features
- [ ] Implement repeat minimization algorithm for group assignments

### Health System
- [ ] Implement interactive health actions (damage/heal/train)
- [ ] Add stats tracking system
  - Track damage dealt
  - Track healing provided
  - Track training sessions
  - Implement cross-session persistence

## Adhoc Ideas & Improvements
- [ ] Host can "freeze" users that abuse the nudge feature (separate tab)
- [ ] Need to think about how the application should handle new participants joining during an active room session
- [ ] room ids can be shorter (maybe 10 char long?)
- [ ] add UI feedback for participants when clicking on buttons such as `Nudge Host`
- [ ] increase button sizes on mobile view
