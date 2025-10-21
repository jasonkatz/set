import type { User } from '@set-game/shared';

interface ScoreboardProps {
  scores: Record<string, number>;
  currentUser: User;
}

export function Scoreboard({ scores, currentUser }: ScoreboardProps) {
  const sortedScores = Object.entries(scores).sort(([, a], [, b]) => b - a);

  return (
    <div className="bg-slate-800/50 rounded-lg p-4 backdrop-blur">
      <h3 className="text-xl font-bold mb-3 text-teal-400">Scoreboard</h3>
      <div className="space-y-2">
        {sortedScores.length === 0 ? (
          <p className="text-slate-400 text-sm">No scores yet</p>
        ) : (
          sortedScores.map(([nickname, score]) => (
            <div
              key={nickname}
              className={`flex justify-between items-center p-2 rounded ${
                nickname === currentUser.nickname
                  ? 'bg-teal-900/50 border border-teal-500'
                  : 'bg-slate-700/30'
              }`}
            >
              <span className="font-medium">{nickname}</span>
              <span className="text-teal-400 font-bold">{score}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
