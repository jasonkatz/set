import { useEffect, useRef, useState } from 'react';
import type { FeedMessage } from '@set-game/shared';
import { socket } from '../lib/socket';

interface FeedProps {
  feed: FeedMessage[];
  gameId: string;
}

export function Feed({ feed, gameId }: FeedProps) {
  const [chatMessage, setChatMessage] = useState('');
  const feedEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [feed]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatMessage.trim()) {
      socket.sendChat(gameId, chatMessage);
      setChatMessage('');
    }
  };

  const getFeedIcon = (msgType: FeedMessage['msgType']) => {
    switch (msgType) {
      case 'join':
        return '👋';
      case 'leave':
        return '👋';
      case 'start':
        return '🎮';
      case 'set':
        return '✅';
      case 'fail':
        return '❌';
      case 'chat':
        return '💬';
      default:
        return '📢';
    }
  };

  const getFeedMessage = (message: FeedMessage) => {
    switch (message.msgType) {
      case 'join':
        return `${message.username} joined the game`;
      case 'leave':
        return `${message.username} left the game`;
      case 'start':
        return `${message.username} started the game`;
      case 'set':
        return `${message.username} found a valid set!`;
      case 'fail':
        return `${message.username} submitted an invalid set`;
      case 'chat':
        return `${message.username}: ${message.data}`;
      case 'create':
        return `${message.username} created the game`;
      default:
        return message.data || '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-slate-200 flex flex-col h-96">
      <h3 className="text-xl font-bold p-4 pb-3 text-blue-600 border-b border-slate-200">
        Activity Feed
      </h3>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {feed.map((message, index) => (
          <div
            key={index}
            className={`text-sm p-2 rounded ${
              message.msgType === 'set'
                ? 'bg-green-100 border-l-2 border-green-500 text-slate-900'
                : message.msgType === 'fail'
                ? 'bg-red-100 border-l-2 border-red-500 text-slate-900'
                : 'bg-slate-100 text-slate-900'
            }`}
          >
            <span className="mr-2">{getFeedIcon(message.msgType)}</span>
            {getFeedMessage(message)}
          </div>
        ))}
        <div ref={feedEndRef} />
      </div>
      <form onSubmit={handleSendChat} className="p-4 pt-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-slate-50 text-slate-900 rounded px-3 py-2 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
