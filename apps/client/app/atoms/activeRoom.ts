import { atom } from 'jotai';

export interface ActiveRoomState {
  roomId: string;
  state: 'waiting' | 'active';
  groups?: { [groupId: string]: string[] };
}

export const activeRoomAtom = atom<ActiveRoomState | null>(null);

// Derived atom to get the current user's group number
export const userGroupAtom = atom((get) => {
  const activeRoom = get(activeRoomAtom);
  const userId = document.cookie
    .split('; ')
    .find((row) => row.startsWith('_bsid='))
    ?.split('=')[1];

  if (!activeRoom?.groups || !userId) return null;

  // Find which group the user belongs to
  for (const [groupId, participants] of Object.entries(activeRoom.groups)) {
    if (participants.includes(userId)) {
      return parseInt(groupId) + 1; // Convert to 1-based group numbers for display
    }
  }

  return null;
});
