import { useState, useEffect } from 'react';
import type { Route } from './+types/host';
import { QRCodeSVG } from 'qrcode.react';
import { useCookies } from 'react-cookie';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Host - Breakout Shuffler' },
    { name: 'description', content: 'Host a breakout room' },
  ];
}

export default function Host() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [cookies] = useCookies(['_bsid']);

  useEffect(() => {
    const fetchHostRoom = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/host`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch host room');
        }

        const room = await response.json();
        if (room) {
          setRoomId(room.id);
        }
      } catch (error) {
        setError(
          error instanceof Error ? error.message : 'Failed to fetch host room'
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (cookies._bsid) {
      fetchHostRoom();
    } else {
      setIsLoading(false);
    }
  }, [cookies._bsid]);

  const handleCreateRoom = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/rooms`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to create room');
      }

      const { roomId } = await response.json();
      setRoomId(roomId);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to create room'
      );
    }
  };

  const joinUrl = roomId ? `${window.location.origin}/rooms/${roomId}` : '';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
        <h1 className="text-4xl font-bold mt-8 mb-6">Loading...</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
      <h1 className="text-4xl font-bold mt-8 mb-6">Host Room</h1>

      {error && (
        <div className="w-full max-w-md mb-4 p-2 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {!roomId ? (
        <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
          <button
            onClick={handleCreateRoom}
            className="w-full px-4 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 transition-colors"
          >
            Create New Room
          </button>
        </div>
      ) : (
        <div className="w-full max-w-md">
          <div className="bg-white p-6 rounded-lg shadow-md mb-4">
            <h2 className="text-xl font-semibold mb-4">Room Created</h2>
            <p className="mb-4">Room ID: {roomId}</p>
            <div className="flex flex-col items-center space-y-4">
              <div className="p-2 bg-white rounded">
                <QRCodeSVG
                  value={joinUrl}
                  size={200}
                  level="H"
                  marginSize={4}
                />
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(joinUrl)}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                Copy Room Link
              </button>
              <span>{joinUrl}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
