import { useState, useEffect } from 'react';
import type { LobbyData, User } from '@set-game/shared';
import { socket } from '../lib/socket';
import { LobbyItem } from '../components/LobbyItem';
import { CreateGameModal } from '../components/CreateGameModal';

interface LobbyProps {
  user: User;
  onExit: () => void;
  onJoinGame: (gameId: string) => void;
}

export function Lobby({ user, onExit, onJoinGame }: LobbyProps) {
  const [lobbyData, setLobbyData] = useState<LobbyData>({
    clients: [],
    users: [],
    games: [],
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    socket.startLobby((data) => {
      setLobbyData(data);
    });

    return () => {
      socket.endLobby();
    };
  }, []);

  const handleCreateGame = (name: string) => {
    socket.createGame(name, (data) => {
      console.log('Game created:', data);
      onJoinGame(data.id);
    });
  };

  const handleJoinGame = (gameId: string) => {
    socket.joinGame(gameId, (success) => {
      if (success) {
        onJoinGame(gameId);
      }
    });
  };

  const handleExit = () => {
    socket.exit(user, (success) => {
      if (success) {
        onExit();
      }
    });
  };

  // Generate gravatar-style icons for users
  const getUserIcon = (nickname: string) => {
    let seed = 0;
    for (let j = 0; j < nickname.length; j++) {
      seed += nickname.charCodeAt(j) * j * 37;
    }
    const hash = seed.toString(16).padStart(32, '0').substring(0, 32);
    return `https://www.gravatar.com/avatar/${hash}?s=30&d=identicon&r=PG`;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between bg-slate-800/30 rounded-lg p-6 backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium">
            👤 {user.nickname}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {lobbyData.users.map((nickname) => (
            <img
              key={nickname}
              src={getUserIcon(nickname)}
              alt={nickname}
              title={nickname}
              className="w-8 h-8 rounded-full border-2 border-slate-600"
            />
          ))}
        </div>
      </div>

      {/* Games list */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4 text-teal-400">Available Games</h2>
        <div className="space-y-3 min-h-[200px]">
          {lobbyData.games.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-lg">No games available</p>
              <p className="text-sm">Create a new game to get started!</p>
            </div>
          ) : (
            lobbyData.games.map((game) => (
              <LobbyItem key={game.id} game={game} onJoin={handleJoinGame} />
            ))
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex-1 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-bold text-lg transition-all shadow-lg hover:shadow-teal-500/50"
        >
          Create New Game
        </button>
        <button
          onClick={handleExit}
          className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Exit
        </button>
      </div>

      <CreateGameModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateGame}
      />
    </div>
  );
}
