import { useState, useEffect } from 'react';
import type { Route } from './+types/host';
import { QRCodeSVG } from 'qrcode.react';
import { useCookies } from 'react-cookie';
import type { Room } from '../types';
import { UserList } from '../components/UserList';
import { sendSocketMessage, socket } from '~/lib/socket';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Host - Breakout Shuffler' },
    { name: 'description', content: 'Host a breakout room' },
  ];
}

export default function Host() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [cookies] = useCookies(['_bsid', '_displayName']);

  useEffect(
    function restoreHostRoom() {
      const fetchHostRoom = async () => {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/host`, {
            credentials: 'include',
          });

          if (!response.ok) {
            throw new Error('Failed to fetch host room');
          }

          if (response.status === 200) {
            const { room }: { room?: Room } = await response.json();
            if (room) {
              setRoomId(room.id);
              sendSocketMessage('joinRoom', {
                roomId: room.id,
                displayName: cookies._displayName,
              });
            }
          }
        } catch (error) {
          setError(
            error instanceof Error ? error.message : 'Failed to fetch host room'
          );
        }
      };

      if (cookies._bsid) {
        fetchHostRoom();
      }
    },
    [cookies._bsid]
  );

  const handleCreateRoom = async () => {
    try {
      setError('');
      setRoomId(null);

      // Listen for room creation response
      const handleRoomCreated = (room: Room) => {
        setRoomId(room.id);
      };

      socket.on('roomCreated', handleRoomCreated);
      socket.emit('createRoom');

      return () => {
        socket.off('roomCreated', handleRoomCreated);
      };
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to create room'
      );
    }
  };

  const joinUrl = roomId ? `${window.location.origin}/rooms/${roomId}` : '';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center p-4">
      <h1 className="text-4xl font-bold mt-8 mb-6 text-gray-900 dark:text-white">
        Host Screen
      </h1>

      {error && (
        <div className="w-full max-w-md mb-4 p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded">
          {error}
        </div>
      )}

      {!roomId ? (
        <div className="w-full max-w-md bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md dark:shadow-gray-900">
          <button
            onClick={handleCreateRoom}
            className="w-full px-4 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 transition-colors"
          >
            Create New Room
          </button>
        </div>
      ) : (
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md dark:shadow-gray-900 mb-4">
            <p className="mb-4 text-gray-900 dark:text-white">
              Room ID: {roomId}
            </p>
            <div className="flex flex-col items-center space-y-4">
              <div className="p-2 bg-white dark:bg-gray-700 rounded">
                <QRCodeSVG
                  value={joinUrl}
                  size={200}
                  level="H"
                  marginSize={4}
                />
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(joinUrl)}
                className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Copy Room Link
              </button>
              <span className="text-gray-700 dark:text-gray-300">
                {joinUrl}
              </span>

              <UserList roomId={roomId} title="Room Users" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
