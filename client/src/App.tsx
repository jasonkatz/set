import { useState } from 'react';
import type { User } from '@set-game/shared';
import { Title } from './views/Title';
import { Lobby } from './views/Lobby';
import { Game } from './views/Game';

type View = 'title' | 'lobby' | 'game';

function App() {
  const [currentView, setCurrentView] = useState<View>('title');
  const [user, setUser] = useState<User | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);

  const handleEnter = (nickname: string) => {
    setUser({
      id: '', // Will be set by server
      nickname,
    });
    setCurrentView('lobby');
  };

  const handleExit = () => {
    setUser(null);
    setGameId(null);
    setCurrentView('title');
  };

  const handleJoinGame = (id: string) => {
    setGameId(id);
    setCurrentView('game');
  };

  const handleReturnToLobby = () => {
    setGameId(null);
    setCurrentView('lobby');
  };

  return (
    <div className="min-h-screen">
      {currentView === 'title' && <Title onEnter={handleEnter} />}
      {currentView === 'lobby' && user && (
        <Lobby user={user} onExit={handleExit} onJoinGame={handleJoinGame} />
      )}
      {currentView === 'game' && user && gameId && (
        <Game gameId={gameId} user={user} onReturnToLobby={handleReturnToLobby} />
      )}
    </div>
  );
}

export default App;
