import type { GameOverview } from '@set-game/shared';

interface LobbyItemProps {
  game: GameOverview;
  onJoin: (gameId: string) => void;
}

export function LobbyItem({ game, onJoin }: LobbyItemProps) {
  const getStatusBadge = () => {
    if (game.finished) {
      return <span className="px-2 py-1 bg-slate-600 text-slate-300 rounded text-xs">Finished</span>;
    }
    if (game.started) {
      return <span className="px-2 py-1 bg-yellow-600 text-white rounded text-xs">In Progress</span>;
    }
    return <span className="px-2 py-1 bg-green-600 text-white rounded text-xs">Waiting</span>;
  };

  return (
    <div className="bg-slate-800/50 rounded-lg p-4 backdrop-blur border border-slate-700 hover:border-teal-500 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-1">{game.name}</h3>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span>{game.members.length} player{game.members.length !== 1 ? 's' : ''}</span>
            {game.members.length > 0 && (
              <span className="text-xs">({game.members.join(', ')})</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge()}
          <button
            onClick={() => onJoin(game.id)}
            disabled={game.finished}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              game.finished
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-teal-600 hover:bg-teal-700 text-white'
            }`}
          >
            Join
          </button>
        </div>
      </div>
    </div>
  );
}
