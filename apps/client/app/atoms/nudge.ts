import { atom } from 'jotai';

export interface NudgeData {
  userId: string;
  displayName: string;
  count: number;
  lastNudge: Date;
}

export const nudgesAtom = atom<NudgeData[]>([]);
export const isShakingAtom = atom<boolean>(false);
