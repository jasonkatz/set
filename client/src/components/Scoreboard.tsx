import type { User } from '@set-game/shared';

interface ScoreboardProps {
  scores: Record<string, number>;
  currentUser: User;
}

export function Scoreboard({ scores, currentUser }: ScoreboardProps) {
  const sortedScores = Object.entries(scores).sort(([, a], [, b]) => b - a);

  return (
    <div className="bg-white rounded-lg p-4 shadow-md border border-slate-200">
      <h3 className="text-xl font-bold mb-3 text-blue-600">Scoreboard</h3>
      <div className="space-y-2">
        {sortedScores.length === 0 ? (
          <p className="text-slate-500 text-sm">No scores yet</p>
        ) : (
          sortedScores.map(([nickname, score]) => (
            <div
              key={nickname}
              className={`flex justify-between items-center p-2 rounded ${
                nickname === currentUser.nickname
                  ? 'bg-blue-100 border border-blue-500'
                  : 'bg-slate-100'
              }`}
            >
              <span className="font-medium text-slate-900">{nickname}</span>
              <span className="text-blue-600 font-bold">{score}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
