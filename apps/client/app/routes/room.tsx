import { useState, useEffect } from 'react';
import type { Route } from '../+types/root';
import { useParams } from 'react-router';
import type { Room as RoomType, User } from './+types/room';
import { UserList } from '../components/UserList';
import { socket, sendSocketMessage } from '../lib/socket';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Room - Breakout Shuffler' },
    { name: 'description', content: 'Join a breakout room' },
  ];
}

interface JoinRoomResponse {
  userId: string;
  userName: string;
  room: RoomType;
}

export default function Room() {
  const { roomId } = useParams();
  const [roomData, setRoomData] = useState<RoomType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userName, setUserName] = useState('');
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    const handleJoinedRoom = ({ room }: JoinRoomResponse) => {
      setLoading(false);
      setHasJoined(true);
      setRoomData(room);
    };

    const handleUserJoined = ({
      userId,
      userName,
    }: {
      userId: string;
      userName: string;
    }) => {
      setRoomData((prev) => {
        if (!prev) return null;
        const newUser: User = {
          id: userId,
          name: userName,
          joinedAt: new Date(),
        };
        return {
          ...prev,
          users: [...prev.users, newUser],
        };
      });
    };

    const handleError = ({ message }: { message: string }) => {
      setLoading(false);
      setError(message);
    };

    socket.on('joinedRoom', handleJoinedRoom);
    socket.on('userJoined', handleUserJoined);
    socket.on('error', handleError);

    return () => {
      socket.off('joinedRoom', handleJoinedRoom);
      socket.off('userJoined', handleUserJoined);
      socket.off('error', handleError);
    };
  }, [roomId]);

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    sendSocketMessage('joinRoom', {
      roomId,
      name: userName.trim() || undefined, // TODO need to implement this in the server later
    });
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center p-4">
        <h1 className="text-4xl font-bold mt-8 mb-6 text-gray-900 dark:text-white">
          Joining Room...
        </h1>
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
            <div className="mb-4 p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded">
              {error}
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
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
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
        <UserList users={roomData?.users || []} />
      </div>
    </div>
  );
}
