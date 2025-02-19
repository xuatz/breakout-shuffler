import { useState, useEffect } from 'react';
import type { Route } from './+types/host';
import { QRCodeSVG } from 'qrcode.react';
import { useCookies } from 'react-cookie';
import type { Room } from '../types';
import { UserList } from '../components/UserList';
import { ErrorMessage } from '../components/ErrorMessage';
import { sendSocketMessage, socket } from '~/lib/socket';
import { calculateGroupDistribution } from '~/lib/groupDistribution';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Host - Breakout Shuffler' },
    { name: 'description', content: 'Host a breakout room' },
  ];
}

export default function Host() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [cookies] = useCookies(['_bsid']);
  const [groupingMode, setGroupingMode] = useState<'size' | 'count'>('size');
  const [groupSize, setGroupSize] = useState(4);
  const [groupCount, setGroupCount] = useState(2);
  const [participants, setParticipants] = useState<any[]>([]);

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
              sendSocketMessage('joinRoom', { roomId: room.id });
              sendSocketMessage('getNudges');
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

  useEffect(() => {
    const handleRoomCreated = (room: Room) => {
      setRoomId(room.id);
    };

    const handleError = ({ message }: { message: string }) => {
      setError(message);
    };

    const handleParticipantsUpdated = ({ participants: newParticipants }: { participants: any[] }) => {
      setParticipants(newParticipants);
    };

    socket.on('roomCreated', handleRoomCreated);
    socket.on('error', handleError);
    socket.on('participantsUpdated', handleParticipantsUpdated);

    return () => {
      socket.off('roomCreated', handleRoomCreated);
      socket.off('error', handleError);
      socket.off('participantsUpdated', handleParticipantsUpdated);
    };
  }, []);

  const handleCreateRoom = async () => {
    try {
      setError('');
      setRoomId(null);
      socket.emit('createRoom');
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
        <div className="w-full max-w-md mb-4">
          <ErrorMessage message={error} />
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

              <div className="w-full p-4 bg-gray-100 dark:bg-gray-700 rounded-lg mb-4">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-gray-700 dark:text-gray-200 font-medium">
                    Group Allocation Mode
                  </label>
                  <div className="flex gap-x-4">
                    <button
                      onClick={() => setGroupingMode('size')}
                      className={`px-3 py-1 rounded ${
                        groupingMode === 'size'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200'
                      }`}
                    >
                      Group Size
                    </button>
                    <button
                      onClick={() => setGroupingMode('count')}
                      className={`px-3 py-1 rounded ${
                        groupingMode === 'count'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200'
                      }`}
                    >
                      Number of Groups
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-x-4 mb-4">
                  <label className="text-gray-700 dark:text-gray-200 font-medium">
                    {groupingMode === 'size' ? 'Group Size' : 'Number of Groups'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={groupingMode === 'size' ? groupSize : groupCount}
                    onChange={(e) => {
                      const value = Math.max(1, parseInt(e.target.value) || 1);
                      if (groupingMode === 'size') {
                        setGroupSize(value);
                      } else {
                        setGroupCount(value);
                      }
                    }}
                    className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>

                {participants.length > 0 && (
                  <div className="text-gray-700 dark:text-gray-200">
                    <p className="font-medium mb-2">Group Distribution Preview:</p>
                    {calculateGroupDistribution(
                      participants.length,
                      groupingMode,
                      groupingMode === 'size' ? groupSize : groupCount
                    ).map((size, index) => (
                      <p key={index} className="ml-4">
                        Group {index + 1}: {size} participants
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <UserList isHost roomId={roomId} title="Room Users" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
