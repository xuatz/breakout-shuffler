import { useState, useEffect } from 'react';
import type { Route } from '../+types/root';
import { useParams } from 'react-router';
import { QRCodeSVG } from 'qrcode.react';
import type { Room, User } from '../types';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Room Poster - Breakout Shuffler' },
    { name: 'description', content: 'Display room poster for projector' },
  ];
}

export default function Poster() {
  const { roomId } = useParams();
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const joinUrl = roomId ? `${window.location.origin}/rooms/${roomId}` : '';

  useEffect(() => {
    if (!roomId) return;

    const fetchRoomData = async () => {
      try {
        const [roomResponse, participantsResponse] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/rooms/${roomId}`),
          fetch(`${import.meta.env.VITE_API_URL}/rooms/${roomId}/participants`),
        ]);

        if (!roomResponse.ok) {
          throw new Error('Room not found');
        }

        const roomData = await roomResponse.json();
        setRoom(roomData);

        if (participantsResponse.ok) {
          const { participants: participantData } = await participantsResponse.json();
          setParticipants(participantData);
        }

        setError('');
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load room');
        setLoading(false);
      }
    };

    fetchRoomData();

    const interval = setInterval(fetchRoomData, 5000);

    return () => clearInterval(interval);
  }, [roomId]);

  if (!roomId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Invalid Room
          </h1>
          <p className="text-2xl text-gray-700 dark:text-gray-300">
            Please use a valid room poster link.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Loading Room...
          </h1>
          <div className="flex justify-center">
            <svg
              className="animate-spin h-16 w-16 text-blue-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-red-600 dark:text-red-400 mb-4">
            Error
          </h1>
          <p className="text-2xl text-gray-700 dark:text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 gap-12 items-start">
          <div className="flex flex-col items-center justify-center space-y-8">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">
                Join Our Room
              </h1>
              <p className="text-3xl text-gray-700 dark:text-gray-300 mb-2">
                Scan the QR Code
              </p>
            </div>

            <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
              <QRCodeSVG
                value={joinUrl}
                size={450}
                level="H"
                marginSize={4}
              />
            </div>

            <div className="text-center">
              <p className="text-2xl text-gray-600 dark:text-gray-400 mb-2">
                Or visit:
              </p>
              <p className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400 break-all">
                {joinUrl}
              </p>
            </div>
          </div>

          <div className="flex flex-col space-y-6">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Room: {roomId}
              </h2>

              <div className="mb-6">
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
                    Status:
                  </span>
                  {room?.state === 'active' ? (
                    <span className="inline-flex items-center px-6 py-3 rounded-full text-2xl font-bold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      <span className="w-4 h-4 bg-green-500 rounded-full mr-3 animate-pulse"></span>
                      Breakout Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-6 py-3 rounded-full text-2xl font-bold bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      <span className="w-4 h-4 bg-yellow-500 rounded-full mr-3"></span>
                      Waiting
                    </span>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Participants ({participants.length})
                </h3>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-h-[600px] overflow-y-auto">
              {participants.length === 0 ? (
                <p className="text-2xl text-gray-500 dark:text-gray-400 text-center py-8">
                  No participants yet. Scan the QR code to join!
                </p>
              ) : (
                <ol className="space-y-3">
                  {participants.map((participant, index) => (
                    <li
                      key={participant.id || index}
                      className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-medium text-gray-900 dark:text-white">
                          {index + 1}. {participant.displayName}
                        </span>
                        {room?.state === 'active' && room.groups && (
                          <span className="text-xl px-4 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full font-semibold">
                            {Object.entries(room.groups).find(([_, userIds]) => 
                              userIds.includes(participant.id)
                            )?.[0] ? `Group ${Number(Object.entries(room.groups).find(([_, userIds]) => 
                              userIds.includes(participant.id)
                            )![0]) + 1}` : 'No Group'}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
