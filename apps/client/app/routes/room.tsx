import { useState, useEffect } from 'react';
import type { Route } from '../+types/root';
import { useParams } from 'react-router';
import type { Room as RoomType } from './+types/room';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Room - Breakout Shuffler' },
    { name: 'description', content: 'Breakout room view' },
  ];
}

export default function Room() {
  const { roomId } = useParams();
  const [roomData, setRoomData] = useState<RoomType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/rooms/${roomId}`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch room data');
        }
        const data = await response.json();
        setRoomData(data);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : 'Failed to fetch room data'
        );
      } finally {
        setLoading(false);
      }
    };

    if (roomId) {
      fetchRoomData();
    }
  }, [roomId]);

  if (!roomId) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
        <h1 className="text-4xl font-bold mt-8 mb-6">Invalid Room</h1>
        <p className="text-lg">Please join a room using a valid link.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
        <h1 className="text-4xl font-bold mt-8 mb-6">Loading Room...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
        <h1 className="text-4xl font-bold mt-8 mb-6">Error</h1>
        <p className="text-lg text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
      <h1 className="text-4xl font-bold mt-8 mb-6">Room: {roomId}</h1>

      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Participants:</h2>

        <div className="mb-4">
          <ul className="space-y-1">
            {roomData?.users.map((user) => (
              <li key={user.id} className="flex items-center">
                <span className="mr-2">•</span>
                <span>{user.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
