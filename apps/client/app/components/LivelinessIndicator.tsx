import React from 'react';

interface LivelinessIndicatorProps {
  timestamp?: string;
}

export const LivelinessIndicator: React.FC<LivelinessIndicatorProps> = ({
  timestamp,
}) => {
  const getStatusColor = () => {
    if (!timestamp) {
      return 'bg-black'; // No data or very old
    }

    try {
      const lastUpdate = new Date(timestamp);
      // Check if the date is valid
      if (isNaN(lastUpdate.getTime())) {
        console.error('Invalid timestamp received:', timestamp);
        return 'bg-black'; // Invalid date
      }

      const now = new Date();
      const diffSeconds = (now.getTime() - lastUpdate.getTime()) / 1000;

      if (diffSeconds < 10) return 'bg-green-500'; // Less than 10s
      if (diffSeconds < 30) return 'bg-yellow-500'; // Less than 30s
      if (diffSeconds < 60) return 'bg-orange-500'; // Less than 1min
      if (diffSeconds < 120) return 'bg-red-500'; // Less than 2min
      return 'bg-black'; // 2min or older
    } catch (error) {
      console.error('Error processing timestamp:', timestamp, error);
      return 'bg-black'; // Error state
    }
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
