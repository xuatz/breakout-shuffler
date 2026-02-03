/**
 * Parses a timestamp and returns the difference in seconds from now.
 * @param timestamp ISO 8601 timestamp string
 * @returns The difference in seconds, or null if the timestamp is invalid
 */
export function getSecondsSince(timestamp?: string): number | null {
  if (!timestamp) {
    return null;
  }

  try {
    const lastUpdate = new Date(timestamp);

    // Check if the date is valid
    if (isNaN(lastUpdate.getTime())) {
      console.error('Invalid timestamp received:', timestamp);
      return null;
    }

    const now = new Date();
    return Math.floor((now.getTime() - lastUpdate.getTime()) / 1000);
  } catch (error) {
    console.error('Error processing timestamp:', timestamp, error);
    return null;
  }
}

/**
 * Converts a timestamp to a human-readable relative time string
 * @param timestamp ISO 8601 timestamp string
 * @returns Formatted relative time string (e.g., "Just now", "5m ago", "2h ago")
 */
export function formatRelativeTime(timestamp?: string): string {
  const diffSeconds = getSecondsSince(timestamp);

  if (diffSeconds === null) {
    return 'Unknown';
  }

  // Less than 10 seconds
  if (diffSeconds < 10) {
    return 'Just now';
  }

  // Less than 1 minute
  if (diffSeconds < 60) {
    return `${diffSeconds}s ago`;
  }

  // Less than 1 hour
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  // Less than 1 day
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  // Days
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  // Weeks
  const diffWeeks = Math.floor(diffDays / 7);
  return `${diffWeeks}w ago`;
}
