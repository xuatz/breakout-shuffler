import { useState, useEffect } from 'react';
import type { Route } from '../+types/root';
import { useParams } from 'react-router';
import { useCookies } from 'react-cookie';
import { useAtom } from 'jotai';
import { displayNameAtom } from '~/atoms/displayName';
import { activeRoomAtom, userGroupAtom } from '~/atoms/activeRoom';
import { UserList } from '../components/UserList';
import { ErrorMessage } from '../components/ErrorMessage';
import { sendSocketMessage, socket } from '~/lib/socket';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Room - Breakout Shuffler' },
    { name: 'description', content: 'Join a breakout room' },
  ];
}

export default function Room() {
  const { roomId } = useParams();
  const [error, setError] = useState('');
  const [cookies] = useCookies(['_bsid']);
  const [displayName, setDisplayName] = useAtom(displayNameAtom);
  const [hasJoined, setHasJoined] = useState(false);
  const [activeRoom, setActiveRoom] = useAtom(activeRoomAtom);
  const userGroup = useAtom(userGroupAtom)[0];

  const joinRoom = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/rooms/${roomId}/join`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        setError('Failed to join room');
      }

      sendSocketMessage('joinRoom', { roomId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room');
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');
    await joinRoom();
  };

  useEffect(
    function restoreUserRoom() {
      const fetchUserRoom = async () => {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/rooms/${roomId}/me`,
            {
              method: 'POST',
              credentials: 'include',
            }
          );

          if (response.status === 200) {
            const { isParticipant } = await response.json();

            if (isParticipant) {
              await joinRoom();
            }
          }
        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : 'Failed to restore room session'
          );
        }
      };

      if (cookies._bsid && roomId) {
        fetchUserRoom();
      }
    },
    [cookies._bsid, roomId]
  );

  useEffect(() => {
    const handleJoinedRoom = () => {
      setHasJoined(true);
    };

    const handleError = ({ message }: { message: string }) => {
      setError(message);
    };

    const handleRoomStateUpdated = ({
      state,
      groups,
    }: {
      state: 'waiting' | 'active';
      groups?: { [groupId: string]: string[] };
    }) => {
      if (roomId) {
        setActiveRoom({
          roomId,
          state,
          groups,
        });
      }
    };

    socket.on('joinedRoom', handleJoinedRoom);
    socket.on('error', handleError);
    socket.on('roomStateUpdated', handleRoomStateUpdated);

    return () => {
      socket.off('joinedRoom', handleJoinedRoom);
      socket.off('error', handleError);
      socket.off('roomStateUpdated', handleRoomStateUpdated);
    };
  }, [roomId, setActiveRoom]);

  if (!roomId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center p-4">
        <h1 className="text-4xl font-bold mt-8 mb-6 text-gray-900 dark:text-white">
          Invalid Room
        </h1>
        <p className="text-lg text-gray-700 dark:text-gray-300">
          Please join a room using a valid link.
        </p>
      </div>
    );
  }

  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center p-4">
        <h1 className="text-4xl font-bold mt-8 mb-6 text-gray-900 dark:text-white">
          Join Room
        </h1>

        <div className="w-full max-w-md bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md dark:shadow-gray-900">
          {error && (
            <div className="mb-4">
              <ErrorMessage message={error} />
            </div>
          )}

          <form onSubmit={handleJoinRoom} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label
                  htmlFor="userName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Your Name
                </label>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Optional - we'll generate one if empty
                </span>
              </div>
              <input
                type="text"
                id="userName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm 
                          bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your name (optional)"
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 
                        transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Join Room
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center p-4">
      <h1 className="text-4xl font-bold mt-8 mb-6 text-gray-900 dark:text-white">
        Room: {roomId}
      </h1>

      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md dark:shadow-gray-900">
        {activeRoom?.state === 'active' && userGroup && (
          <div className="mb-6 p-4 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <p className="text-lg font-semibold text-blue-800 dark:text-blue-100">
              You are in Group {userGroup}
            </p>
          </div>
        )}
        <UserList roomId={roomId} />
      </div>
    </div>
  );
}
