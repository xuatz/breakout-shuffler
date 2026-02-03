import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatRelativeTime, getSecondsSince } from './timeFormat';

describe('formatRelativeTime', () => {
  beforeEach(() => {
    // Mock the current time to 2025-01-01 12:00:00 UTC
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return "Just now" for timestamps less than 10 seconds old', () => {
    const timestamp = new Date('2025-01-01T11:59:55Z').toISOString();
    expect(formatRelativeTime(timestamp)).toBe('Just now');
  });

  it('should return seconds for timestamps less than 1 minute old', () => {
    const timestamp = new Date('2025-01-01T11:59:30Z').toISOString();
    expect(formatRelativeTime(timestamp)).toBe('30s ago');
  });

  it('should return minutes for timestamps less than 1 hour old', () => {
    const timestamp = new Date('2025-01-01T11:45:00Z').toISOString();
    expect(formatRelativeTime(timestamp)).toBe('15m ago');
  });

  it('should return hours for timestamps less than 1 day old', () => {
    const timestamp = new Date('2025-01-01T09:00:00Z').toISOString();
    expect(formatRelativeTime(timestamp)).toBe('3h ago');
  });

  it('should return days for timestamps less than 1 week old', () => {
    const timestamp = new Date('2024-12-29T12:00:00Z').toISOString();
    expect(formatRelativeTime(timestamp)).toBe('3d ago');
  });

  it('should return weeks for timestamps older than 1 week', () => {
    const timestamp = new Date('2024-12-11T12:00:00Z').toISOString();
    expect(formatRelativeTime(timestamp)).toBe('3w ago');
  });

  it('should return "Unknown" for undefined timestamp', () => {
    expect(formatRelativeTime(undefined)).toBe('Unknown');
  });

  it('should return "Unknown" for invalid timestamp', () => {
    expect(formatRelativeTime('invalid-date')).toBe('Unknown');
  });

  it('should handle edge case of exactly 10 seconds', () => {
    const timestamp = new Date('2025-01-01T11:59:50Z').toISOString();
    expect(formatRelativeTime(timestamp)).toBe('10s ago');
  });

  it('should handle edge case of exactly 1 minute', () => {
    const timestamp = new Date('2025-01-01T11:59:00Z').toISOString();
    expect(formatRelativeTime(timestamp)).toBe('1m ago');
  });
});

describe('getSecondsSince', () => {
  beforeEach(() => {
    // Mock the current time to 2025-01-01 12:00:00 UTC
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return correct seconds for a valid timestamp', () => {
    const timestamp = new Date('2025-01-01T11:59:30Z').toISOString();
    expect(getSecondsSince(timestamp)).toBe(30);
  });

  it('should return null for undefined timestamp', () => {
    expect(getSecondsSince(undefined)).toBeNull();
  });

  it('should return null for invalid timestamp', () => {
    expect(getSecondsSince('invalid-date')).toBeNull();
  });

  it('should return 0 for current timestamp', () => {
    const timestamp = new Date('2025-01-01T12:00:00Z').toISOString();
    expect(getSecondsSince(timestamp)).toBe(0);
  });

  it('should handle timestamps from hours ago', () => {
    const timestamp = new Date('2025-01-01T10:00:00Z').toISOString();
    expect(getSecondsSince(timestamp)).toBe(7200); // 2 hours = 7200 seconds
  });
});
