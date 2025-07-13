import { createTRPCReact } from '@trpc/react-query';
import { createWSClient, wsLink } from '@trpc/client';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../server/router';
import superjson from 'superjson';

export const trpc = createTRPCReact<AppRouter>();

// Create WebSocket client with reconnection
let wsClient: ReturnType<typeof createWSClient> | null = null;

export function createTRPCClient() {
  // Create WebSocket client with proper reconnection handling
  wsClient = createWSClient({
    url: 'ws://localhost:3001/trpc',
    retryDelayMs: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onOpen: () => {
      console.log('WebSocket connection established');
    },
    onClose: (cause) => {
      console.log('WebSocket connection closed:', cause);
    },
  });

  return trpc.createClient({
    transformer: superjson,
    links: [
      // Use WebSocket link for subscriptions
      wsLink({
        client: wsClient,
      }),
      // Use HTTP for queries and mutations
      httpBatchLink({
        url: 'http://localhost:3001/trpc',
        fetch(url, options) {
          return fetch(url, {
            ...options,
            credentials: 'include', // Include cookies
          });
        },
      }),
    ],
  });
}

// Export function to manually close WebSocket (useful for testing)
export function closeWebSocket() {
  if (wsClient) {
    wsClient.close();
  }
}