import { describe, it, expect } from 'vitest';
import { calculateGroupDistribution } from './groupDistribution';

describe('calculateGroupDistribution', () => {
  describe('Group Size Mode', () => {
    it('handles empty participant list', () => {
      expect(calculateGroupDistribution(0, 'size', 4)).toEqual([]);
    });

    it('handles invalid group size', () => {
      expect(calculateGroupDistribution(10, 'size', 0)).toEqual([10]);
      expect(calculateGroupDistribution(10, 'size', -1)).toEqual([10]);
    });

    it('creates even groups when possible', () => {
      expect(calculateGroupDistribution(12, 'size', 4)).toEqual([4, 4, 4]);
    });

    it('handles remaining participants by redistributing when small remainder', () => {
      // 21 participants with size 4 should create 4,4,4,3,3,3 groups
      // instead of 4,4,4,4,4,1
      expect(calculateGroupDistribution(21, 'size', 4)).toEqual([
        4, 4, 4, 3, 3, 3,
      ]);
    });

    it('creates a separate group for larger remainders', () => {
      // 14 participants with size 4 should create 4,4,3,3 groups
      expect(calculateGroupDistribution(14, 'size', 4)).toEqual([4, 4, 3, 3]);
    });
  });

  describe('Group Count Mode', () => {
    it('handles empty participant list', () => {
      expect(calculateGroupDistribution(0, 'count', 3)).toEqual([]);
    });

    it('handles invalid group count', () => {
      expect(calculateGroupDistribution(10, 'count', 0)).toEqual([10]);
      expect(calculateGroupDistribution(10, 'count', -1)).toEqual([10]);
    });

    it('distributes participants evenly when possible', () => {
      expect(calculateGroupDistribution(9, 'count', 3)).toEqual([3, 3, 3]);
    });

    it('distributes remainder participants across groups', () => {
      // 10 participants in 3 groups should be 4,3,3
      expect(calculateGroupDistribution(10, 'count', 3)).toEqual([4, 3, 3]);
    });

    it('limits groups to total participants', () => {
      // If we request more groups than participants, it should create
      // single-person groups up to the number of participants
      expect(calculateGroupDistribution(3, 'count', 5)).toEqual([1, 1, 1]);
    });
  });
});
