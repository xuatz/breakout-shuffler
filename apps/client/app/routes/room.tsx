import { useEffect, useRef } from 'react';
import type { Route } from '../+types/root';
import { useParams } from 'react-router';
import { useCookies } from 'react-cookie';
import { useAtom } from 'jotai';
import { useMachine } from '@xstate/react';
import { displayNameAtom } from '~/atoms/displayName';
import { UserList } from '../components/UserList';
import { socket } from '~/lib/socket';
import { roomMachine } from '~/machines/roomMachine';
import { generateRandomName } from '@breakout-shuffler/shared';

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
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Initialize the XState machine
  const [state, send] = useMachine(roomMachine);

  // Handle form submission with the state machine
  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();

    if (roomId) {
      send({ type: 'JOIN', roomId });
    }
  };

  const handleShuffleName = () => {
    setDisplayName(generateRandomName());
    if (nameInputRef.current) {
      nameInputRef.current.setCustomValidity('');
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDisplayName(value);
    // Clear custom validity on change so validation can re-run
    e.target.setCustomValidity('');
  };

  const handleNameInvalid = (e: React.InvalidEvent<HTMLInputElement>) => {
    e.target.setCustomValidity(
      'Please enter a name or click shuffle to generate one',
    );
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
      if (state === 'active') {
        send({ type: 'ROOM_BREAKOUT_ACTIVE', state, groups });
      } else {
        send({ type: 'ROOM_BREAKOUT_ABORT', state, groups });
      }
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
            <div>
              <label
                htmlFor="userName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Your Name
              </label>
              <div className="flex gap-2">
                <input
                  ref={nameInputRef}
                  type="text"
                  id="userName"
                  value={displayName}
                  onChange={handleNameChange}
                  onInvalid={handleNameInvalid}
                  required
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm 
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your name"
                />
                <button
                  type="button"
                  onClick={handleShuffleName}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm
                            bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300
                            hover:bg-gray-50 dark:hover:bg-gray-600
                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                            transition-colors"
                  title="Generate random name"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM7.5 18c-.83 0-1.5-.67-1.5-1.5S6.67 15 7.5 15s1.5.67 1.5 1.5S8.33 18 7.5 18zm0-9C6.67 9 6 8.33 6 7.5S6.67 6 7.5 6 9 6.67 9 7.5 8.33 9 7.5 9zm4.5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm0-9c-.83 0-1.5-.67-1.5-1.5S15.67 6 16.5 6s1.5.67 1.5 1.5S17.33 9 16.5 9z" />
                  </svg>
                </button>
              </div>
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
          {state.matches({ joined: 'active' }) && (
            <div className="mb-6 p-8 bg-blue-600 dark:bg-blue-700 rounded-xl shadow-lg border-4 border-blue-700 dark:border-blue-500 flex items-center justify-center min-h-[180px]">
              <div className="text-center">
                <p className="text-sm font-medium text-white/90 dark:text-white/80 mb-2 uppercase tracking-wide">
                  Your Assignment
                </p>
                <p className="text-5xl font-bold text-white mb-1">
                  Group {Number(state.context.userGroup || 0) + 1}
                </p>
              </div>
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
