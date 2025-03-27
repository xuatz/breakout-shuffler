import { useState, useEffect } from 'react';
import type { Route } from '../+types/root';
import { useParams } from 'react-router';
import { useCookies } from 'react-cookie';
import { useAtom } from 'jotai';
import { useMachine } from '@xstate/react';
import { displayNameAtom } from '~/atoms/displayName';
import { UserList } from '../components/UserList';
import { ErrorMessage } from '../components/ErrorMessage';
import { sendSocketMessage, socket } from '~/lib/socket';
import { roomMachine } from '~/machines/roomMachine';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Room - Breakout Shuffler' },
    { name: 'description', content: 'Join a breakout room' },
  ];
}

export default function Room() {
  const { roomId } = useParams();
  const [cookies] = useCookies(['_bsid']);
  const [displayName, setDisplayName] = useAtom(displayNameAtom);
  const [error, setError] = useState('');

  // Initialize the XState machine
  const [state, send] = useMachine(roomMachine);

  // Handle form submission with the state machine
  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();

    if (roomId) {
      send({ type: 'JOIN', roomId });
    }
  };

  // Check if user is already in room
  useEffect(() => {
    if (cookies._bsid && roomId) {
      send({ type: 'CHECK_ROOM', roomId });
    }
  }, [cookies._bsid, roomId, send]);

  // Connect socket events to the state machine
  useEffect(() => {
    const handleJoinedRoom = () => {
      send({ type: 'JOINED_ROOM' });
    };

    const handleKicked = () => {
      send({ type: 'KICKED' });
      window.location.href = '/';
    };

    const handleRoomStateUpdated = ({
      state,
      groups,
    }: {
      state: 'waiting' | 'active';
      groups?: { [groupId: string]: string[] };
    }) => {
      send({ type: 'ROOM_STATE_UPDATED', state, groups });
    };

    socket.on('joinedRoom', handleJoinedRoom);
    socket.on('roomStateUpdated', handleRoomStateUpdated);
    socket.on('kicked', handleKicked);

    return () => {
      socket.off('joinedRoom', handleJoinedRoom);
      socket.off('roomStateUpdated', handleRoomStateUpdated);
      socket.off('kicked', handleKicked);
    };
  }, [roomId, send]);

  // Use XState machine state to determine what to render

  // If no roomId is provided, show invalid room message
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

  // If in idle state (not joined yet), show the join form
  if (state.matches('idle')) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center p-4">
        <h1 className="text-4xl font-bold mt-8 mb-6 text-gray-900 dark:text-white">
          Join Room
        </h1>

        <div className="w-full max-w-md bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md dark:shadow-gray-900">
          <form onSubmit={handleJoinRoom} className="space-y-4">
            {error && (
              <div className="mb-4">
                <ErrorMessage message={error} />
              </div>
            )}
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

  // If in joining or waitingForSocket state, show loading indicator
  if (state.matches('joining') || state.matches('waitingForSocket')) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center p-4">
        <h1 className="text-4xl font-bold mt-8 mb-6 text-gray-900 dark:text-white">
          Joining Room...
        </h1>
        <div className="w-full max-w-md bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md dark:shadow-gray-900 flex justify-center">
          <div className="animate-pulse text-blue-500">
            <svg
              className="w-10 h-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              ></path>
            </svg>
          </div>
        </div>
      </div>
    );
  }

  // For joined state, show the room UI
  if (state.matches('joined')) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center p-4">
        <h1 className="text-4xl font-bold mt-8 mb-6 text-gray-900 dark:text-white">
          Room: {roomId}
        </h1>

        <div className="w-full max-w-md bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md dark:shadow-gray-900">
          {state.matches({ joined: 'active' }) && state.context.userGroup && (
            <div className="mb-6 p-4 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <p className="text-lg font-semibold text-blue-800 dark:text-blue-100">
                You are in Group {state.context.userGroup}
              </p>
            </div>
          )}
          <UserList roomId={roomId} />
        </div>
      </div>
    );
  }

  // Fallback UI (should not reach here)
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center p-4">
      <h1 className="text-4xl font-bold mt-8 mb-6 text-gray-900 dark:text-white">
        Room State: {state.value.toString()}
      </h1>
      <p>Current machine state: {JSON.stringify(state.value)}</p>
    </div>
  );
}
