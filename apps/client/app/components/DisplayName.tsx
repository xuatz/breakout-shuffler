import { useCookies } from 'react-cookie';
import type { User } from '../types';
import { LivelinessIndicator } from './LivelinessIndicator';
import { twMerge } from 'tailwind-merge';

interface DisplayNameProps {
  user: User;
  isHost?: boolean;
}

export const DisplayName: React.FC<DisplayNameProps> = ({ user, isHost }) => {
  const [cookies] = useCookies(['_bsid']);
  const userId = cookies._bsid;
  const isYou = user.id === userId;

  return (
    <div className="relative w-full">
      <div className="bg-white dark:bg-gray-800 rounded p-2 flex items-center">
        <span className="mr-2">•</span>
        {isHost && !isYou && (
          <LivelinessIndicator timestamp={user.lastLivelinessUpdateAt} />
        )}
        <span className={twMerge('ml-2', isYou && 'font-extrabold')}>
          {user.displayName || user.id}
          {isYou && ` (this is you!)`}
        </span>
      </div>
    </div>
  );
};
