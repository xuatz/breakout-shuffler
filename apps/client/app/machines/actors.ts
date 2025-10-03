import { fromPromise } from 'xstate';
import { sendSocketMessage } from '~/lib/socket';

// Define the API calls
export const joinRoomActor = fromPromise(
  async ({ input }: { input: { roomId: string } }) => {
    const { roomId } = input;

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/rooms/${roomId}/join`,
      {
        method: 'POST',
        credentials: 'include',
      },
    );

    if (!response.ok) {
      throw new Error('Failed to join room');
    }

    // Send socket message to join the room
    sendSocketMessage('joinRoom', { roomId });

    return { roomId };
  },
);

export const checkRoomActor = fromPromise(
  async ({ input }: { input: { roomId: string } }) => {
    const { roomId } = input;

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/rooms/${roomId}/me`,
      {
        method: 'POST',
        credentials: 'include',
      },
    );

    if (!response.ok) {
      throw new Error('Failed to check room status');
    }

    const data = await response.json();
    return { isParticipant: data.isParticipant };
  },
);
