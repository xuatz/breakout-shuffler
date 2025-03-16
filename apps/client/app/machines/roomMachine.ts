import { setup, fromPromise, assign } from 'xstate';
import { sendSocketMessage } from '~/lib/socket';

// Define the join room API call
export const joinRoomLogic = fromPromise(async ({ input }: { input: { roomId: string } }) => {
  const { roomId } = input;
  
  const response = await fetch(`${import.meta.env.VITE_API_URL}/rooms/${roomId}/join`, {
    method: 'POST',
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to join room');
  }
  
  // Send socket message to join the room
  sendSocketMessage('joinRoom', { roomId });
  
  return { roomId };
});

// Create the machine
export const roomMachine = setup({
  types: {
    context: {} as {
      roomId: string | undefined;
      error: string | undefined;
    },
    events: {} as 
      | { type: 'JOIN'; roomId: string }
      | { type: 'RETRY' }
      | { type: 'JOINED_ROOM' }
      | { type: 'ERROR'; message: string },
  },
  actors: {
    joinRoomLogic,
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QCcD2qC2A6AlhANmAMQBSA8gJIByA2gAwC6ioADqrDgC46oB2zIAB6IAjACYAbFjoyZAZhEAOEQHYZqgDQgAnqLoisEsQFY6YlcYAsx44uMmAvg61pMWAFaocvb1CIQ+MFxeADdUAGsg12xPb18EbzCAYwBDbj56BkyBNg50-iQhREsVSywlC1U6CTo5AE4RSzktXQR6uuk6iTkVMTrLOmMROksnF3QYrx9ePzBkNGQsFnw0gDNUZGxojyn4xNRU-MzswtyuHgLQYQQSsoqhtRr6xuadRDFJLBKJYxUJRToijEtQkYxA2wA7ilzjMAGIbADKB0inFIlCoAFEACIAfQASmQyABZE6sdjnPgCa52MrGBR9Jo1CQSFQqFrFCRlAZGCR1FRKSw-ORgyHQ7hwxHIsCojF4gl40kgM75KmIGlYOnifpyJkstlvNr-L6aprWcyWRoiiZYOYLIh4jEAFTxAE1FcqLqqEA07tz-h9BcoJOyEMoNbJVBV9BYnM4QLxUBA4AJojlySrCtcALTBg05q1uPCENN5T2Z4piEPiMp2ES-EQKRRySzAxQFyZxGYlimXIoIMQ9Qx0OpyAHmKx1YH61rDAxyIbGXldBsiSPtrBQmFQeHIJFJFHdjNXRAsuRYFTNga-D7qXOteqKTrdP5mpRGdexXiQQ9l48IYYmFgQLKL0PwfKOlYGoKZ4-EYiinsoTZiOutobD+lLlv+ZjGEBYggZI9gDkCIYmHQ561I0QL2BIdZ-LGDhAA */
  id: 'room',
  initial: 'idle',
  context: {
    roomId: undefined,
    error: undefined,
  },
  states: {
    idle: {
      on: {
        JOIN: {
          target: 'joining',
          actions: assign({
            roomId: ({ event }) => event.roomId,
            error: (_) => undefined,
          }),
        },
      },
    },
    joining: {
      invoke: {
        src: 'joinRoomLogic',
        input: ({ context }) => ({
          roomId: context.roomId as string,
        }),
        onDone: {
          target: 'waitingForSocket',
        },
        onError: {
          target: 'error',
          actions: assign({
            error: ({ event }) => {
              // Handle the unknown error type safely
              const errorMessage = event.error instanceof Error 
                ? event.error.message 
                : String(event.error);
              return errorMessage;
            },
          }),
        },
      },
    },
    waitingForSocket: {
      on: {
        JOINED_ROOM: 'joined',
        ERROR: {
          target: 'error',
          actions: assign({
            error: ({ event }) => event.message,
          }),
        },
      },
    },
    joined: {
      type: 'final',
    },
    error: {
      on: {
        RETRY: {
          target: 'joining',
          actions: assign({
            error: (_) => undefined,
          }),
        },
      },
    },
  },
});
