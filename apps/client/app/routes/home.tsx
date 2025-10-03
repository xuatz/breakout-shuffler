import { useState } from 'react';
import type { Route } from './+types/home';
import { useNavigate } from 'react-router';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Join Room - Breakout Shuffler' },
    { name: 'description', content: 'Join an existing breakout room' },
  ];
}

export default function Home() {
  const [roomId, setRoomId] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleJoinRoom = async () => {
    if (!roomId) {
      setError('Room ID is required');
      return;
    }

    setIsJoining(true);
    setError('');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/rooms/${roomId}/join`,
        {
          method: 'POST',
        },
      );

      if (!response.ok) {
        throw new Error('Failed to join room');
      }

      const data = await response.json();
      navigate(`/rooms/${roomId}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to join room');
    } finally {
      setIsJoining(false);
    }
  };

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

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
            Room ID
          </label>
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Enter room ID"
          />
        </div>

        <button
          onClick={handleJoinRoom}
          disabled={isJoining}
          className="w-full px-4 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {isJoining ? 'Joining...' : 'Join Room'}
        </button>
      </div>
    </div>
  );
}
