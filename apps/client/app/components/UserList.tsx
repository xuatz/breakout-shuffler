import { useEffect, useState } from 'react';
import type { User } from '../types';
import { sendSocketMessage, socket } from '~/lib/socket';
import { useCookies } from 'react-cookie';
import { HostActionModal } from './HostActionModal';
import { DisplayName } from './DisplayName';

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
  const [cookies] = useCookies(['_bsid', '_debug']);
  const userId = cookies._bsid;
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Set up health check interval
  useEffect(() => {
    const interval = setInterval(() => {
      sendSocketMessage('healthCheck');
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
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

    const handleHealthUpdate = ({
      userId: updatedUserId,
      health,
      lastHealthCheck,
    }: {
      userId: string;
      health: number;
      lastHealthCheck: string;
    }) => {
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === updatedUserId
            ? { ...user, health, lastHealthCheck }
            : user
        )
      );
    };

    const handleKicked = ({ roomId: kickedRoomId }: { roomId: string }) => {
      if (kickedRoomId === roomId) {
        window.location.href = '/'; // Redirect to home page
      }
    };

    socket.on('participantsUpdated', handleParticipantsUpdated);
    socket.on('hostNudged', handleHostNudged);
    socket.on('healthUpdate', handleHealthUpdate);
    socket.on('kicked', handleKicked);

    return () => {
      socket.off('participantsUpdated', handleParticipantsUpdated);
      socket.off('hostNudged', handleHostNudged);
      socket.off('healthUpdate', handleHealthUpdate);
      socket.off('kicked', handleKicked);
    };
  }, [roomId]);

  const handleUserClick = (user: User) => {
    if (isHost && user.id !== userId) {
      setSelectedUser(user);
      setIsModalOpen(true);
    }
  };

  const handleNudgeUser = () => {
    if (selectedUser) {
      console.log('Nudging user:', selectedUser.id);
      console.log('TOOD: Implement nudge user socket event')
    }
  };

  const handleKickUser = () => {
    if (selectedUser) {
      sendSocketMessage('kickUser', {
        roomId,
        targetUserId: selectedUser.id,
      });
    }
  };

  return (
    <div className="w-full bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4 relative">
      <h3 className="flex text-lg font-semibold text-gray-800 dark:text-white mb-3 gap-x-2">
        {title} ({users?.length || 0})
        {cookies._debug && (
          <button
            onClick={() => {
              sendSocketMessage('debugPing', { pingerId: userId, roomId });
            }}
            className="px-2 py-1 text-sm bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded transition-colors duration-200"
          >
            Ping
          </button>
        )}
        {!isHost && (
          <button
            onClick={() => {
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
            className={`bg-white dark:bg-gray-800 rounded-md shadow-sm transition-shadow duration-200 text-gray-700 dark:text-gray-300 ${
              isHost && user.id !== userId
                ? 'hover:shadow-md cursor-pointer'
                : ''
            }`}
            onClick={() => handleUserClick(user)}
          >
            <DisplayName user={user} />
          </li>
        ))}
      </ol>
      {selectedUser && (
        <HostActionModal
          isOpen={isModalOpen}
          participant={selectedUser}
          onNudge={handleNudgeUser}
          onKick={handleKickUser}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
