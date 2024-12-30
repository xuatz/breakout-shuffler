import React, { useState, useEffect } from 'react';
import { socket, sendSocketMessage, setupSocketListeners } from '~/lib/socket';

const Chat: React.FC = () => {
  const [username, setUsername] = useState('');
  const [isUsernameSet, setIsUsernameSet] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<{ user: string; text: string }[]>([]);

  useEffect(() => {
    // setupSocketListeners();

    socket.on('connect', () => {
      console.log('Connected to Socket.IO server');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
    });

    socket.on('hello', (data: { user: string; text: string }) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('chat message');
    };
  }, []);

  const handleSend = () => {
    if (message.trim() !== '' && username.trim() !== '') {
      sendSocketMessage('chat message', { user: username, text: message });
      setMessages((prev) => [...prev, { user: 'You', text: message }]);
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleSetUsername = () => {
    if (username.trim() !== '') {
      setIsUsernameSet(true);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-4 border rounded-lg shadow-lg bg-white">
      {!isUsernameSet ? (
        <div className="flex flex-col items-center">
          <h2 className="text-2xl font-semibold mb-4">Set Your Username</h2>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            className="w-full px-3 py-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSetUsername}
            className="w-full px-4 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Join Chat
          </button>
        </div>
      ) : (
        <>
          <h2 className="text-2xl font-semibold mb-4 text-center">Chat</h2>
          <div className="h-64 overflow-y-auto mb-4 p-2 border rounded bg-gray-100">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-center">No messages yet.</p>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className="mb-2">
                  <span className="font-medium">{msg.user}:</span> {msg.text}
                </div>
              ))
            )}
          </div>
          <div className="flex">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSend}
              className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-r hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Send
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Chat;
