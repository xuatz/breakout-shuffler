// Types
export type RoomState = 'waiting' | 'active';
export type MachineState =
  | 'idle'
  | 'checking'
  | 'joining'
  | 'waitingForSocket'
  | { joined: 'waiting' }
  | { joined: 'active' };

interface GroupAssignment {
  [groupId: string]: string[];
}

export type RoomContext = {
  roomId: string | undefined;
  error: string | undefined;
  roomState: RoomState | undefined;
  groups: GroupAssignment | undefined;
  userGroup: string | undefined;
  health: number | undefined;
  lastHealthCheck: string | undefined;
};

export type RoomEvent =
  | { type: 'JOIN'; roomId: string }
  | { type: 'CHECK_ROOM'; roomId: string }
  | { type: 'RETRY' }
  | { type: 'JOINED_ROOM' }
  | { type: 'ERROR'; message: string }
  | { type: 'ROOM_STATE_UPDATED'; state: RoomState; groups?: GroupAssignment }
  | { type: 'HEALTH_UPDATE'; health: number; lastHealthCheck: string }
  | { type: 'START_BREAKOUT' }
  | { type: 'END_BREAKOUT' }
  | { type: 'ABORT_BREAKOUT' }
  | { type: 'KICKED' };
