import { useEffect, useState } from 'react';
import { useCookies } from 'react-cookie';
import type { User } from '../types';

interface DisplayNameProps {
  user: User & {
    health?: number;
    lastHealthCheck?: string;
  };
}

export const DisplayName: React.FC<DisplayNameProps> = ({ user }) => {
  const [cookies] = useCookies(['_bsid']);
  const userId = cookies._bsid;
  const [localHealth, setLocalHealth] = useState(user.health ?? 0);

  // Update local health when props change
  useEffect(() => {
    if (user.health !== undefined) {
      setLocalHealth(user.health);
    }
  }, [user.health]);

  // Health decay effect
  useEffect(() => {
    if (!user.lastHealthCheck) return;

    const interval = setInterval(() => {
      const lastCheck = new Date(user.lastHealthCheck!); // We know it's not undefined here
      const now = new Date();
      const secondsSinceLastCheck = (now.getTime() - lastCheck.getTime()) / 1000;

      // Calculate target health based on time since last check
      let targetHealth = 100;
      if (secondsSinceLastCheck > 120) targetHealth = 30;
      else if (secondsSinceLastCheck > 60) targetHealth = 70;
      else {
        // Linear decay from 100 to 70 in the first minute
        targetHealth = 100 - (secondsSinceLastCheck * 30) / 60;
      }

      setLocalHealth((prev) => {
        // Faster decay rate
        const decayAmount = 2;
        const next = Math.max(targetHealth, prev - decayAmount);
        return next;
      });
    }, 50); // Update more frequently for smoother animation

    return () => clearInterval(interval);
  }, [user.lastHealthCheck]);

  const getHealthColor = () => {
    if (!user.lastHealthCheck) return 'bg-gray-500/60 dark:bg-gray-600/60';
    if (localHealth > 70) return 'bg-green-500/60 dark:bg-green-600/60';
    if (localHealth > 50) return 'bg-yellow-500/60 dark:bg-yellow-600/60';
    return 'bg-red-500/60 dark:bg-red-600/60';
  };

  return (
    <div className="relative w-full">
      {/* Base layer */}
      <div className="absolute inset-0 bg-white dark:bg-gray-800 rounded" />
      
      {/* Health bar layer */}
      <div
        className={`absolute inset-y-0 left-0 transition-all duration-200 rounded ${getHealthColor()}`}
        style={{ width: `${localHealth}%` }}
      />

      {/* Content layer */}
      <div className="relative flex items-center w-full p-2">
        <span className="mr-2">•</span>
        <span>
          {user.displayName || user.id}
          {user.id === userId && ` (you)`}
        </span>
      </div>
    </div>
  );
};
