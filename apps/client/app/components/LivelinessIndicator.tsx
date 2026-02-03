import React from 'react';
import { getSecondsSince } from '../lib/timeFormat';

interface LivelinessIndicatorProps {
  timestamp?: string;
}

export const LivelinessIndicator: React.FC<LivelinessIndicatorProps> = ({
  timestamp,
}) => {
  const getStatusColor = () => {
    const diffSeconds = getSecondsSince(timestamp);

    if (diffSeconds === null) {
      return 'bg-black'; // No data or invalid
    }

    if (diffSeconds < 10) return 'bg-green-500'; // Less than 10s
    if (diffSeconds < 30) return 'bg-yellow-500'; // Less than 30s
    if (diffSeconds < 60) return 'bg-orange-500'; // Less than 1min
    if (diffSeconds < 120) return 'bg-red-500'; // Less than 2min
    return 'bg-black'; // 2min or older
  };

  return (
    <div
      className={`w-3 h-3 rounded-full flex-shrink-0 ${getStatusColor()}`}
      title={`Last seen: ${
        timestamp ? new Date(timestamp).toLocaleString() : 'Unknown'
      }`}
    ></div>
  );
};
