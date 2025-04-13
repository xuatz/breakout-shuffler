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
  /** @xstate-layout N4IgpgJg5mDOIC5QCcD2qC2A6AlhANmAMQBSA8gJIByA2gAwC6ioADqrDgC46oB2zIAB6IAtAEYAnFgDMdaWIDsAVgBsAJgkqlE1dIA0IAJ6iVADgVYVC0wBYV0tWqV2HAX1cG0mXAWIBhAAkAUT8AaQB9ACUyMgBZeiYkEDYObj4BYQRxGzosBStpUxUJDTEtA2Ms0zE1LDUcugU1MTobU1sld090bABjAAswXoBrHF4oIgg+MFxeADdUYZmvPsGRsagEMYXegEM03gSEgRSuHn4kzLElaSwxWTazZqKlOlMK0U0LCTpnsVMlGoVCoal0QCssAMhqNxpNprMFkssBCoetxlt5qg9gcjmJEqx2Gd0pdRM5btIVL8FP8bP9lGIPllHlhqgo2XIFDYbkpTGCUWsYRMwMg0MgsCx8PsAGaoZDYfnQjYYnb7c5HRgnQkHDKiNT5LB0eymWQ8mxqN5qRkiCT-O48koScxOBStPk9LAAK1QYw2cN4M22i2W7q9PvRgexasYxySp21JIQ+SUBukjuN1mkFPKRlEqdqnLaFMkZXNNjd3lDvF9wtF4slnBlcuRIe9VfDmMjfHV+OSWvOOoQmbElm0vxabTUpj1NitSmpLJtYjaPyUkhUZY84PdAHddmdxgAxWUAZSxS04pEoVCCABEojF4hrY33iaArjk7jlmjbqqvF1aHGHRozTUIcbg5ctsF3fcoCPZBTxGMALyCSJokiGMCVSfsE2tYczFaOg6FeUxNDoGorVpFQsAkF1fh+VN1zNSDPVbSAiGiOJwgAIUiIIAEFQjIABVAAVcI+L8ESKAANSCDDeyw18hFEGoqKHeQimaQjzAkK0zBkBxQM0LQXRI5jKzYjjYm43iBOEsS+K4shIhE+S42wt9EC5GwDMcfJgQkQL1ytcw8nyBRpDZdlGmaczWIgIgULQtyXwuTyEEpCwbAkGxpGyr9qVTADcryHRVCBUCs2NOKxjY0IKDCW8UsUtLlKyc1h1pGjGjeVcLQAzMsBsM02W0cxnDImr-QgLBoO4WFjxEviXJs-jBNE5qiVaq4nGo2kqUaLRtEKRkShZIFMxKQiJApOgJCmyAsF2XpuDmYggioO8eLW+zNvjdLFFyYE2SCpxVzMRlJFuV4aWqSjDWGh6Zue17iEc5yxO+uyNqfTCtoHf5ah+KdmhB6cKUZeQqKcBx8l+OxbDUdxN14VAIDgAQVk1FqBxEbRh1uvUaTpVcrRaJRk0cPrV2GvLeU3CE8EIbn8Zw-4qNMOQAWkVR2muWdVwNGpQJuBxM3MZjUUFFX-rawm7jI9onBtXKrEtHMqlkajKUUQEtBsZQpo2G2PLazWfIUG1COysQl3kfQPZEMxTDyQj1ycKcHBo5i5o2OCEPPEOlKuBwsAliXI+B2PCneRPUx8nkmnXQEAQBDdugreKi+2lTOQM+51a0t5a8qcRlANIKQUNIobpupHZr3eaoG7gdzWTLPQKKdo2ljvT19njQ5EpTM8vnlGcDelecID6iXaaWkXVpdpIeuOo7sUVNtFeakxGZ1wgA */
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
        ROOM_BREAKOUT_ACTIVE: {
          target: '.active',
          actions: assign({
            roomState: ({ event }) => event.state,
            groups: ({ event }) => event.groups,
            // Update userGroup if groups are provided and user is in a group
            userGroup: ({ context, event }) => {
              if (!event.groups) {
                return undefined;
              }

              // Extract user ID from cookie
              const userId = document.cookie
                .split('; ')
                .find((row) => row.startsWith('_bsid='))
                ?.split('=')[1];

              if (!userId) {
                return undefined;
              }

              // Find which group the user is in
              for (const [groupId, users] of Object.entries(event.groups)) {
                if (users.includes(userId)) {
                  return groupId;
                }
              }

              return undefined;
            },
          }),
        },
        ROOM_BREAKOUT_ABORT: {
          target: '.waiting',
          actions: assign({
            roomState: ({ event }) => event.state,
            groups: ({ event }) => event.groups,
            userGroup: (_) => undefined,
          }),
        },
        // ROOM_BREAKOUT_END: {},
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
