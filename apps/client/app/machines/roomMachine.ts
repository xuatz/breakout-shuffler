import { setup, assign } from 'xstate';
import { sendSocketMessage } from '~/lib/socket';
import { joinRoomActor, checkRoomActor } from './actors';
import type { RoomContext, RoomEvent } from './types';

export const roomMachine = setup({
  types: {
    context: {} as RoomContext,
    events: {} as RoomEvent,
  },
  actors: {
    joinRoomActor,
    checkRoomActor,
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
    health: undefined,
    lastHealthCheck: undefined,
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
        CHECK_ROOM: {
          target: 'checking',
          actions: assign({
            roomId: ({ event }) => event.roomId,
            error: (_) => undefined,
          }),
        },
      },
    },
    checking: {
      invoke: {
        src: 'checkRoomActor',
        input: ({ context }) => ({
          roomId: context.roomId as string,
        }),
        onDone: [
          {
            guard: ({ event }) => event.output.isParticipant,
            target: 'joining',
          },
          {
            target: 'idle',
          },
        ],
        onError: {
          target: 'idle',
          actions: assign({
            error: ({ event }) => (event.error as Error).message,
          }),
        },
      },
    },
    joining: {
      invoke: {
        src: 'joinRoomActor',
        input: ({ context }) => ({
          roomId: context.roomId as string,
        }),
        onDone: {
          target: 'waitingForSocket',
        },
        onError: {
          target: 'idle',
          actions: assign({
            error: ({ event }) => (event.error as Error).message,
          }),
        },
      },
    },
    waitingForSocket: {
      entry: () => sendSocketMessage('healthCheck'),
      on: {
        JOINED_ROOM: 'joined',
        ERROR: {
          target: 'idle',
          actions: assign({
            error: ({ event }) => event.message,
          }),
        },
      },
    },
    joined: {
      initial: 'waiting',
      states: {
        waiting: {
          on: {
            START_BREAKOUT: {
              target: 'active',
              actions: ({ context }) => sendSocketMessage('startBreakout'),
            },
          },
        },
        active: {
          on: {
            END_BREAKOUT: {
              target: 'waiting',
              actions: ({ context }) => sendSocketMessage('endBreakout'),
            },
            ABORT_BREAKOUT: {
              target: 'waiting',
              actions: ({ context }) => sendSocketMessage('abortBreakout'),
            },
          },
        },
      },
      on: {
        ROOM_STATE_UPDATED: {
          actions: [
            assign({
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
              },
            }),
            // Transition to correct state based on room state
            ({ event }) => {
              if (event.state === 'active') {
                return { type: 'START_BREAKOUT' };
              } else {
                return { type: 'END_BREAKOUT' };
              }
            },
          ],
        },
        HEALTH_UPDATE: {
          actions: assign({
            health: ({ event }) => event.health,
            lastHealthCheck: ({ event }) => event.lastHealthCheck,
          }),
        },
        ERROR: {
          actions: assign({
            error: ({ event }) => event.message,
          }),
        },
        KICKED: {
          target: '#room.idle',
          reenter: true,
        },
      },
    },
  },
});
