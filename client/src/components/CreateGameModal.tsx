import { useState } from 'react';

interface CreateGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

export function CreateGameModal({ isOpen, onClose, onCreate }: CreateGameModalProps) {
  const [gameName, setGameName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gameName.trim()) {
      onCreate(gameName.trim());
      setGameName('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md border border-slate-700">
        <h2 className="text-2xl font-bold mb-4 text-teal-400">Create New Game</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="gameName" className="block text-sm font-medium mb-2 text-slate-300">
              Game Name
            </label>
            <input
              type="text"
              id="gameName"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              placeholder="Enter game name"
              className="w-full bg-slate-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              autoFocus
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!gameName.trim()}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                gameName.trim()
                  ? 'bg-teal-600 hover:bg-teal-700 text-white'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
