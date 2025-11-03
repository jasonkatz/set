import { useState } from 'react';
import { socket } from '../lib/socket';

interface TitleProps {
  onEnter: (nickname: string) => void;
}

export function Title({ onEnter }: TitleProps) {
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    socket.enter(nickname || undefined, (data) => {
      setIsLoading(false);
      if (data.success && data.nickname) {
        onEnter(data.nickname);
      } else {
        console.error('Failed to enter:', data.errorMessage);
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            SET
          </h1>
          <p className="text-xl text-slate-600">Welcome to the game!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className={`bg-white rounded-lg p-6 shadow-lg border border-slate-200 ${isLoading ? 'opacity-50' : ''}`}>
            <div className="mb-6">
              <label htmlFor="nickname" className="block text-sm font-medium mb-2 text-slate-700">
                Nickname (optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">👤</span>
                <input
                  type="text"
                  id="nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Enter your nickname"
                  disabled={isLoading}
                  className="w-full bg-slate-50 text-slate-900 rounded pl-10 pr-3 py-3 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Leave blank for a random nickname
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white py-3 rounded-lg font-bold text-lg transition-all shadow-lg hover:shadow-blue-500/50 disabled:shadow-none"
            >
              {isLoading ? 'Entering...' : 'Enter Lobby'}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center text-sm text-slate-600">
          <p>Find three cards that form a valid set!</p>
          <p className="mt-2">Each attribute must be all the same or all different across the three cards.</p>
        </div>
      </div>
    </div>
  );
}
