import type { Route } from './+types/home';
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Admin - Breakout Shuffler' },
    { name: 'description', content: 'Create and manage breakout rooms' },
  ];
}

export default function Admin() {
  const [roomId, setRoomId] = useState<string | null>(null);

  const handleCreateRoom = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/rooms`, {
        method: 'POST',
      });
      const data = await response.json();
      setRoomId(data.roomId);
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
      <h1 className="text-4xl font-bold mt-8 mb-6">Admin Panel</h1>

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
                  value={`${window.location.origin}?roomId=${roomId}`}
                  size={200}
                  level="H"
                  marginSize={4}
                />
              </div>
              <button
                onClick={() =>
                  navigator.clipboard.writeText(
                    `${window.location.origin}?roomId=${roomId}`
                  )
                }
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                Copy Room Link
              </button>
              <span>{`${window.location.origin}?roomId=${roomId}`}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
