import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc, createTRPCClient, closeWebSocket } from './trpc';
import Cookies from 'js-cookie';

const queryClient = new QueryClient();
const trpcClient = createTRPCClient();

function SessionInfo() {
  const { data: sessionInfo } = trpc.getSessionInfo.useQuery();
  
  return (
    <div className="session-info">
      <h3>Session Information</h3>
      {sessionInfo ? (
        <div>
          <p>Session ID: <code>{sessionInfo.sessionId}</code></p>
          <p>User ID: <code>{sessionInfo.userId}</code></p>
          <p>Is New Session: <strong>{sessionInfo.isNewSession ? 'Yes' : 'No'}</strong></p>
          <p>Connection Count: <strong>{sessionInfo.connectionCount}</strong></p>
          <p>Total Active Sessions: <strong>{sessionInfo.activeSessions}</strong></p>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

function DebugSessions() {
  const { data: sessions } = trpc.debugSessions.useQuery(undefined, {
    refetchInterval: 2000, // Refresh every 2 seconds
  });
  
  return (
    <div className="debug-sessions">
      <h3>All Active Sessions (Debug)</h3>
      {sessions ? (
        <table>
          <thead>
            <tr>
              <th>Session ID</th>
              <th>User ID</th>
              <th>Last Seen</th>
              <th>Connection Count</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session.sessionId}>
                <td><code>{session.sessionId.substring(0, 8)}...</code></td>
                <td><code>{session.userId}</code></td>
                <td>{new Date(session.lastSeen).toLocaleTimeString()}</td>
                <td>{session.connectionCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

function Room({ roomId }: { roomId: string }) {
  const [userName, setUserName] = useState('');
  const [message, setMessage] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [roomState, setRoomState] = useState<any>(null);
  
  const joinRoom = trpc.joinRoom.useMutation({
    onSuccess: () => {
      setHasJoined(true);
    },
  });
  
  const sendMessage = trpc.sendMessage.useMutation();
  
  // Subscribe to room updates
  trpc.roomUpdates.useSubscription(
    { roomId },
    {
      enabled: hasJoined,
      onData: (data) => {
        console.log('Room update received:', data);
        if (data.type === 'initialState') {
          setRoomState(data.room);
        } else if (data.type === 'messageReceived' && roomState) {
          setRoomState({
            ...roomState,
            messages: [...roomState.messages, data.message],
          });
        } else if (data.type === 'participantJoined' || data.type === 'participantLeft') {
          setRoomState(data.room);
        }
      },
      onError: (err) => {
        console.error('Subscription error:', err);
      },
    }
  );
  
  const handleJoin = () => {
    if (userName.trim()) {
      joinRoom.mutate({ roomId, userName });
    }
  };
  
  const handleSendMessage = () => {
    if (message.trim() && hasJoined) {
      sendMessage.mutate({ roomId, text: message });
      setMessage('');
    }
  };
  
  if (!hasJoined) {
    return (
      <div className="join-form">
        <h3>Join Room: {roomId}</h3>
        <input
          type="text"
          placeholder="Enter your name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
        />
        <button onClick={handleJoin}>Join Room</button>
      </div>
    );
  }
  
  return (
    <div className="room">
      <h3>Room: {roomId}</h3>
      
      <div className="participants">
        <h4>Participants ({roomState?.participants.length || 0})</h4>
        {roomState?.participants.map((p: any) => (
          <div key={p.sessionId}>
            {p.name} ({p.sessionId.substring(0, 8)}...)
          </div>
        ))}
      </div>
      
      <div className="messages">
        <h4>Messages</h4>
        <div className="message-list">
          {roomState?.messages.map((msg: any) => (
            <div key={msg.id} className="message">
              <strong>{msg.userId.substring(0, 8)}...</strong>: {msg.text}
            </div>
          ))}
        </div>
      </div>
      
      <div className="message-input">
        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
}

function AppContent() {
  const [userId, setUserId] = useState(Cookies.get('userId') || '');
  const [roomId] = useState('test-room');
  
  useEffect(() => {
    // Set a user ID cookie if not present
    if (!userId) {
      const newUserId = `user-${Math.random().toString(36).substring(7)}`;
      Cookies.set('userId', newUserId, { sameSite: 'lax' });
      setUserId(newUserId);
    }
  }, [userId]);
  
  return (
    <div className="app">
      <h1>tRPC Subscriptions POC - Client Reconnection Testing</h1>
      
      <div className="actions">
        <button onClick={() => window.location.reload()}>
          Reload Page (Test Reconnection)
        </button>
        <button onClick={() => closeWebSocket()}>
          Close WebSocket (Simulate Disconnect)
        </button>
        <button onClick={() => {
          Cookies.remove('userId');
          Cookies.remove('trpc-session-id');
          window.location.reload();
        }}>
          Clear Session & Reload
        </button>
      </div>
      
      <div className="container">
        <SessionInfo />
        <Room roomId={roomId} />
        <DebugSessions />
      </div>
    </div>
  );
}

export function App() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </trpc.Provider>
  );
}