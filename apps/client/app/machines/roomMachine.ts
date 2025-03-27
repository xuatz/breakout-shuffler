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
  /** @xstate-layout N4IgpgJg5mDOIC5QCcD2qC2A6AlhANmAMQBSA8gJIByA2gAwC6ioADqrDgC46oB2zIAB6IAjHQCc4rOIBMIgOziRAZjrzlygKwAOADQgAnogAsGrCIBsdHcfGnNMi8YC+z-Wky4CxAMIAJAFEfAGkAfQAlMjIAWXomJBA2Dm4+AWEEMW0pWQUlVXUtPUNEC3ELLBllbXk6a2VjYwsZcVd3dGwAYwALMA6AaxxeKCIIPjBcXgA3VD7xj06e-sGoBEHpjoBDFN44uIEkrh5+BPSm-SMMzXltLGqRY0VjayuRVpB5rG7egaGRsYnprMsB8vkshqspqhNttdiJ4qx2IdUidRBJsnJFCo1BodOcSsYbupqrVNMYZGodG8QYsfsMwMg0MgsCx8FsAGaoZDYanfZYQ9ZbI67Rj7RHbNKoyTSDF5bGFPEITRKrDXJWSTTPTTiTRU9pYABWqEGyz+vHGaxmcz1huN4It0KFjD2CQO4pRCBkMnkKrK2h01yqDzoygVYmDWGMIm0ygD8gs8euus8Nt4JvpjOZrM4HK5wOtRtTdshDr4wvhiTFRwlCHkMlDzWM0ijMejpWsBKT2AA7htDkMAGKcgDKUNmnFIlCoAQAIhEorERS7K8jQOlPd7FBY-dVo9ogyHiggLGYCdot01FPIHNpO1ge32oIPkCP+mBxwFwpFws6Eckq+71x9Ld-V3fcFWjTQVREBwyWgpwrhkW8U0gIhIhiUIhwAFQAQUwgJQgAVQABWnXCZx-Cs-xXIREHkWsVQsJURBkPclB0EQFS9ZQI0cGQlWMa9lBEFQkILFDAmwgAZTC-EIkiyIo11-1XWjxEJMorzJUkrm0IoLgUb0HiEkRZGUJwvVEwYUI-L9FOXY4VIQVssCcOgCWuGRTDoZjwJELAHFqOg+PqT0zJaNx3nzKyICIYIKBCcjF1-JEHJopztBkLB6jMjKz2PGwFU0UoGLkBwtQE0pLLNCA717bhfiw7Dwkw0IACFwgCbDgjIAjMLsqjUvSbSeKjaCdGUJQWIVIMsuUTzN1rPigosKrICwDYOm4SZiACKhZ3azrut6-qUurUlMs8yQ6JjNT+IVeMLqqCx5CeAk+M0V4Io+ZCao2rbiGw1qyGatqOq6nq+qSyjTvdc6KlscRrsUP1SUK+MKj9CxoN0s9SWUVwIt4VAIDgAR5lFAbqwAWgsBUqcgtTAqZpmo1vPBCApmHHLDOhpSjIzxFqOaOMPK5vQ+0qTI+3TmNvUFaU5t1udMG4dOeRo1SVQq4xcmNoNUD7az3KrlkV5S0pjTKEdkJptEsDKRf0ubececQhNUMpIx1L69XverH2HUc3zN6j0jJcCY2kSM7ePckCTUVaIBDwbECqPyJEtsonGEnzDyqTLo0usQty0AzE9qh9k+rF7ILEWQjbUKwptF2QsG8uQuIyoSXvLv6cG2qv3TJKQM9rLPI2EutRe86R6mDLJqiqMyCecIA */
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
