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

const GROUP_COLORS = [
  {
    bg: 'bg-blue-100 dark:bg-blue-900',
    text: 'text-blue-800 dark:text-blue-200',
    border: 'border-blue-300 dark:border-blue-700',
  },
  {
    bg: 'bg-green-100 dark:bg-green-900',
    text: 'text-green-800 dark:text-green-200',
    border: 'border-green-300 dark:border-green-700',
  },
  {
    bg: 'bg-purple-100 dark:bg-purple-900',
    text: 'text-purple-800 dark:text-purple-200',
    border: 'border-purple-300 dark:border-purple-700',
  },
  {
    bg: 'bg-orange-100 dark:bg-orange-900',
    text: 'text-orange-800 dark:text-orange-200',
    border: 'border-orange-300 dark:border-orange-700',
  },
  {
    bg: 'bg-pink-100 dark:bg-pink-900',
    text: 'text-pink-800 dark:text-pink-200',
    border: 'border-pink-300 dark:border-pink-700',
  },
  {
    bg: 'bg-indigo-100 dark:bg-indigo-900',
    text: 'text-indigo-800 dark:text-indigo-200',
    border: 'border-indigo-300 dark:border-indigo-700',
  },
  {
    bg: 'bg-red-100 dark:bg-red-900',
    text: 'text-red-800 dark:text-red-200',
    border: 'border-red-300 dark:border-red-700',
  },
  {
    bg: 'bg-yellow-100 dark:bg-yellow-900',
    text: 'text-yellow-800 dark:text-yellow-200',
    border: 'border-yellow-300 dark:border-yellow-700',
  },
  {
    bg: 'bg-teal-100 dark:bg-teal-900',
    text: 'text-teal-800 dark:text-teal-200',
    border: 'border-teal-300 dark:border-teal-700',
  },
  {
    bg: 'bg-cyan-100 dark:bg-cyan-900',
    text: 'text-cyan-800 dark:text-cyan-200',
    border: 'border-cyan-300 dark:border-cyan-700',
  },
];

interface WaitingStateViewProps {
  roomId: string;
  joinUrl: string;
  participants: User[];
}

function WaitingStateView({
  roomId,
  joinUrl,
  participants,
}: WaitingStateViewProps) {
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
              <QRCodeSVG value={joinUrl} size={450} level="H" marginSize={4} />
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
                  <span className="inline-flex items-center px-6 py-3 rounded-full text-2xl font-bold bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    <span className="w-4 h-4 bg-yellow-500 rounded-full mr-3"></span>
                    Waiting
                  </span>
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
                      <span className="text-2xl font-medium text-gray-900 dark:text-white">
                        {index + 1}. {participant.displayName}
                      </span>
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

interface ActiveBreakoutViewProps {
  roomId: string;
  room: Room;
  participants: User[];
}

function ActiveBreakoutView({
  roomId,
  room,
  participants,
}: ActiveBreakoutViewProps) {
  const getGridColumns = (groupCount: number) => {
    if (groupCount <= 4) return 'grid-cols-2';
    if (groupCount <= 8) return 'grid-cols-3';
    return 'grid-cols-4';
  };

  if (!room.groups) return null;

  const groupEntries = Object.entries(room.groups);
  const gridCols = getGridColumns(groupEntries.length);

  const groupedParticipants = groupEntries.map(([groupId, userIds]) => {
    const groupMembers = participants.filter((p) => userIds.includes(p.id));
    return {
      groupId: Number(groupId),
      members: groupMembers,
    };
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
                Room: {roomId}
              </h1>
              <p className="text-2xl text-gray-600 dark:text-gray-400">
                {participants.length} Participants • {groupEntries.length}{' '}
                Groups
              </p>
            </div>
            <span className="inline-flex items-center px-8 py-4 rounded-full text-3xl font-bold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              <span className="w-5 h-5 bg-green-500 rounded-full mr-4 animate-pulse"></span>
              Breakout Active
            </span>
          </div>
        </div>

        <div className={`grid ${gridCols} gap-6`}>
          {groupedParticipants.map(({ groupId, members }) => {
            const colorScheme = GROUP_COLORS[groupId % GROUP_COLORS.length];
            return (
              <div
                key={groupId}
                className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border-4 ${colorScheme.border}`}
              >
                <div className={`${colorScheme.bg} ${colorScheme.text} p-6`}>
                  <h2 className="text-4xl font-bold text-center">
                    Group {groupId + 1}
                  </h2>
                  <p className="text-2xl text-center mt-2 opacity-90">
                    {members.length}{' '}
                    {members.length === 1 ? 'Member' : 'Members'}
                  </p>
                </div>
                <div className="p-6">
                  {members.length === 0 ? (
                    <p className="text-2xl text-gray-500 dark:text-gray-400 text-center py-8">
                      No members
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {members.map((member, index) => (
                        <li
                          key={member.id}
                          className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"
                        >
                          <span className="text-2xl font-medium text-gray-900 dark:text-white">
                            {index + 1}. {member.displayName}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
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
          const { participants: participantData } =
            await participantsResponse.json();
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

  if (!room) return null;

  return room.state === 'active' ? (
    <ActiveBreakoutView
      roomId={roomId}
      room={room}
      participants={participants}
    />
  ) : (
    <WaitingStateView
      roomId={roomId}
      joinUrl={joinUrl}
      participants={participants}
    />
  );
}
