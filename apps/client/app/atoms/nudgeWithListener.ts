import { atomWithListeners } from './atomWithListeners';
import type { NudgeData } from './nudge';

export const [nudgesAtom, useNudgesListener] = atomWithListeners<NudgeData[]>(
  [],
);
