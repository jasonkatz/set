import { useState, useEffect, useRef } from 'react';
import type { GameState, User, Card as CardType } from '@set-game/shared';
import { socket } from '../lib/socket';
import { GameBoard } from '../components/GameBoard';
import { Scoreboard } from '../components/Scoreboard';
import { Feed } from '../components/Feed';

// Track games we've explicitly left to prevent double cleanup during StrictMode
const leftGames = new Set<string>();

interface GameProps {
  gameId: string;
  user: User;
  onReturnToLobby: () => void;
}

export function Game({ gameId, user, onReturnToLobby }: GameProps) {
  const [gameState, setGameState] = useState<GameState>({
    id: gameId,
    members: [],
    cards: [],
    scores: {},
    feed: [],
    owner: '',
    started: false,
    finished: false,
  });
  const [selectedCards, setSelectedCards] = useState<Set<CardType>>(new Set());
  const userRef = useRef(user);
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update ref when user changes
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    // Cancel any pending cleanup when mounting/remounting
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = null;
    }

    socket.gameUpdate(gameId, (data) => {
      if (data.id !== gameId) return;

      setGameState(data);

      // Reset selection on set submit or fail
      if (data.feed.length > 0) {
        const lastFeed = data.feed[data.feed.length - 1];
        if (
          (lastFeed.msgType === 'fail' && lastFeed.username === userRef.current.nickname) ||
          lastFeed.msgType === 'set'
        ) {
          setSelectedCards(new Set());
        }
      }
    });

    // Only cleanup on unmount if we haven't explicitly left
    // Use a timeout to avoid calling endGame during StrictMode's immediate remount
    return () => {
      if (!leftGames.has(gameId)) {
        cleanupTimeoutRef.current = setTimeout(() => {
          leftGames.add(gameId);
          socket.endGame(gameId, userRef.current, () => {
            console.log('Left game on unmount');
          });
        }, 100); // Small delay to allow StrictMode remount to cancel
      }
    };
  }, [gameId]);

  const handleCardToggle = (card: CardType, selected: boolean) => {
    setSelectedCards((prev) => {
      const newSet = new Set(prev);
      if (selected && newSet.size < 3) {
        newSet.add(card);
      } else if (!selected) {
        newSet.delete(card);
      }
      return newSet;
    });
  };

  const handleSubmitSet = () => {
    if (selectedCards.size !== 3) return;

    socket.submitSet(gameId, Array.from(selectedCards), (result) => {
      console.log(result.message);
    });
  };

  const handleStartGame = () => {
    socket.startGame(gameId, (success) => {
      if (success) {
        console.log('Game started');
      }
    });
  };

  const handleReturnToLobby = () => {
    // Explicitly leave the game before returning to lobby
    leftGames.add(gameId); // Mark as left to prevent double cleanup
    socket.endGame(gameId, userRef.current, () => {
      onReturnToLobby();
    });
  };

  const isOwner = gameState.owner === user.nickname;
  const canStart = isOwner && !gameState.started;
  const canSubmitSet = selectedCards.size === 3 && !gameState.finished;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Game board */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-lg p-6 shadow-md border border-slate-200">
            <h2 className="text-2xl font-bold mb-4 text-blue-600">
              {gameState.name || 'Game'}
            </h2>
            {gameState.cards.length > 0 ? (
              <>
                <GameBoard
                  cards={gameState.cards}
                  selectedCards={selectedCards}
                  onCardToggle={handleCardToggle}
                />
                <button
                  onClick={handleSubmitSet}
                  disabled={!canSubmitSet}
                  className={`w-full mt-6 py-4 rounded-lg font-bold text-xl transition-all ${
                    canSubmitSet
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/50'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {gameState.finished ? 'Game Over' : 'SET!'}
                </button>
              </>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <p className="text-lg">Waiting for game to start...</p>
              </div>
            )}
          </div>
        </div>

        {/* Right column - Scoreboard and Feed */}
        <div className="space-y-4">
          <Scoreboard scores={gameState.scores} currentUser={user} />
          <Feed feed={gameState.feed} currentUser={user} gameId={gameId} />
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleReturnToLobby}
              className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-3 rounded-lg font-medium transition-colors"
            >
              Return to Lobby
            </button>
            <button
              onClick={handleStartGame}
              disabled={!canStart}
              className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                canStart
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              Start Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
