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
export type RoomState = 'waiting' | 'active';

interface GroupAssignment {
  [groupId: string]: string[];
}

export const roomMachine = setup({
  types: {
    context: {} as {
      roomId: string | undefined;
      error: string | undefined;
      roomState: RoomState | undefined;
      groups: GroupAssignment | undefined;
      userGroup: string | undefined;
    },
    events: {} as 
      | { type: 'JOIN'; roomId: string }
      | { type: 'RETRY' }
      | { type: 'JOINED_ROOM' }
      | { type: 'ERROR'; message: string }
      | { type: 'ROOM_STATE_UPDATED'; state: RoomState; groups?: GroupAssignment }
      | { type: 'KICKED' },
  },
  actors: {
    joinRoomLogic,
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QCcD2qC2A6AlhANmAMQBSA8gJIByA2gAwC6ioADqrDgC46oB2zIAB6IAjACYAbFjoyZAZhEAOEQHYZqgDQgAnqLoisEsQFY6YlcYAsx44uMmAvg61pMWAFaocvb1CIQ+MFxeADdUAGsg12xPb18EbzCAYwBDbj56BkyBNg50-iQhRDkATmMsSzk5S2USkrExOkVzLV0EBrksETpjOVMVaqULFScXdGwAdxSuXwAxVGQAZVQkyM5SSioAUQARAH0AJTIyAFlswtyZvgFhBEs6EqwrMWbjEroVd8tv1sRLCToWAUigkyhUihKoOMI2cIGiHi8vEgRCOpz2iwAKgBBDFbPYAVQACjscbtzqx2FcCqBbiJ7oYVJZGZVlCIqr8EHI6J0VLzLCUFCVPipQaM4eMEd5kQBpCgAYWlZMYOUp+RuiHMQLEgxEVjpPSMHLE9UM9VsFhKiksIgkIicsN4qAgcAE0RVeR41KKCAAtI0GRJbFbbG8WRy6RUAQLunIAR9emL4XhCO6qeq7mJw2JLFg7LqVGylNVGopExLYj5eFBU2rCrc5MosGorRI1JV3qDw-onlZQX1jGyhc0y24pjMq-Mlis1jXPen7mJpHY6N9GtUJALjBy5JIsMajNqISCFNmRzFEZBZ9c68Uc6CLDubMMQRIOf9ASJxNbsy9WzZjPaDhAA */
  id: 'room',
  initial: 'idle',
  context: {
    roomId: undefined,
    error: undefined,
    roomState: undefined,
    groups: undefined,
    userGroup: undefined,
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
        }
      },
    },
    waitingForSocket: {
      on: {
        JOINED_ROOM: 'joined'
      },
    },
    joined: {
      on: {
        ROOM_STATE_UPDATED: {
          actions: assign({
            roomState: ({ event }) => event.state,
            groups: ({ event }) => event.groups,
            // Update userGroup if groups are provided and user is in a group
            userGroup: ({ context, event }) => {
              if (!event.groups || !context.roomId) return undefined;
              
              // Find which group the user is in
              for (const [groupId, users] of Object.entries(event.groups)) {
                if (users.includes(context.roomId)) {
                  return groupId;
                }
              }
              return undefined;
            }
          })
        },
        KICKED: {
          target: "idle",
          reenter: true
        }
      }
    }
  },
});
