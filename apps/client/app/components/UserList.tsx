import { useEffect, useState } from 'react';
import type { User } from '../types';
import { sendSocketMessage, socket } from '~/lib/socket';
import { useCookies } from 'react-cookie';

interface UserListProps {
  roomId: string;
  title?: string;
  isHost?: boolean;
}

export function UserList({
  roomId,
  title = 'Participants',
  isHost = false,
}: UserListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [cookies] = useCookies(['_bsid']);
  const userId = cookies._bsid;

  useEffect(() => {
    const handleDebugPing = ({
      pingerId,
      roomId: pingRoomId,
    }: {
      pingerId: string;
      roomId: string;
    }) => {
      if (pingRoomId === roomId) {
        console.log('xz:ping recieved from:', pingerId);
      }
    };

    const handleParticipantsUpdated = ({
      participants,
    }: {
      participants: User[];
    }) => {
      setUsers(participants);
    };

    const handleHostNudged = () => {
      console.log('xz:host nudged');
    };

    socket.on('debugPing', handleDebugPing);
    socket.on('participantsUpdated', handleParticipantsUpdated);
    socket.on('hostNudged', handleHostNudged);

    return () => {
      socket.off('debugPing', handleDebugPing);
      socket.off('participantsUpdated', handleParticipantsUpdated);
      socket.off('hostNudged', handleHostNudged);
    };
  }, [roomId]);

  return (
    <div className="w-full bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4 relative">
      <h3 className="flex text-lg font-semibold text-gray-800 dark:text-white mb-3 gap-x-2">
        {title} ({users?.length || 0})
        <button
          onClick={() => {
            console.log('xz:onClick:ping');
            sendSocketMessage('debugPing', { pingerId: userId, roomId });
          }}
          className="px-2 py-1 text-sm bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded transition-colors duration-200"
        >
          Ping
        </button>
        {!isHost && (
          <button
            onClick={() => {
              console.log('xz:onClick:nudgeHost');
              sendSocketMessage('nudgeHost');
            }}
            className="px-2 py-1 text-sm bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded transition-colors duration-200"
          >
            Nudge Host
          </button>
        )}
      </h3>
      <ol className="space-y-2">
        {users?.map((user, index) => (
          <li
            key={user.id || index}
            className="px-3 py-2 bg-white dark:bg-gray-800 rounded-md shadow-sm hover:shadow-md transition-shadow duration-200 text-gray-700 dark:text-gray-300"
          >
            <span className="mr-2">•</span>
            <span>
              {user.displayName || user.id}
              {user.id === userId && ` (you)`}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
