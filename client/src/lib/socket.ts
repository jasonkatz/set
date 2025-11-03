import type {
  LobbyData,
  GameState,
  Card,
  User,
} from '@set-game/shared';

const API_BASE = import.meta.env.DEV ? 'http://localhost:3000/api' : '/api';

class APIClient {
  private lobbyEventSource: EventSource | null = null;
  private gameEventSource: EventSource | null = null;

  private async fetchAPI(endpoint: string, options?: RequestInit) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  listenForError(_callback: () => void): void {
    // For REST API, errors are handled per-request
    // This method kept for API compatibility but is a no-op
  }

  async enter(nickname: string, password: string, callback: (data: { success: boolean; nickname?: string; errorMessage?: string }) => void): Promise<void> {
    try {
      const result = await this.fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ nickname, password }),
      });
      callback({ success: result.success, nickname: result.user?.nickname });
    } catch (error) {
      callback({
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Login failed'
      });
    }
  }

  async exit(_user: User, callback: (success: boolean) => void): Promise<void> {
    try {
      const result = await this.fetchAPI('/auth/logout', { method: 'POST' });
      callback(result.success);
    } catch (error) {
      callback(false);
    }
  }

  startLobby(callback: (data: LobbyData) => void): void {
    if (this.lobbyEventSource) {
      this.lobbyEventSource.close();
    }

    this.lobbyEventSource = new EventSource(`${API_BASE}/lobby/stream`, {
      withCredentials: true,
    });

    this.lobbyEventSource.addEventListener('LOBBY UPDATE', (event) => {
      const data = JSON.parse(event.data);
      callback(data);
    });

    this.lobbyEventSource.onerror = (error) => {
      console.error('Lobby SSE error:', error);
    };
  }

  endLobby(): void {
    if (this.lobbyEventSource) {
      this.lobbyEventSource.close();
      this.lobbyEventSource = null;
    }
  }

  async joinGame(gameId: string, callback: (success: boolean) => void): Promise<void> {
    try {
      const result = await this.fetchAPI(`/games/${gameId}/join`, { method: 'POST' });
      callback(result.success);
    } catch (error) {
      callback(false);
    }
  }

  async createGame(name: string, callback: (data: { id: string }) => void): Promise<void> {
    try {
      const result = await this.fetchAPI('/games', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      callback({ id: result.id });
    } catch (error) {
      console.error('Failed to create game:', error);
    }
  }

  async startGame(gameId: string, callback: (success: boolean) => void): Promise<void> {
    try {
      const result = await this.fetchAPI(`/games/${gameId}/start`, { method: 'POST' });
      callback(result.success);
    } catch (error) {
      callback(false);
    }
  }

  gameUpdate(gameId: string, callback: (data: GameState) => void): void {
    if (this.gameEventSource) {
      this.gameEventSource.close();
    }

    this.gameEventSource = new EventSource(`${API_BASE}/games/${gameId}/stream`, {
      withCredentials: true,
    });

    this.gameEventSource.addEventListener('GAME UPDATE', (event) => {
      const data = JSON.parse(event.data);
      callback(data);
    });

    this.gameEventSource.onerror = (error) => {
      console.error('Game SSE error:', error);
    };
  }

  async sendChat(gameId: string, message: string): Promise<void> {
    try {
      await this.fetchAPI(`/games/${gameId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      });
    } catch (error) {
      console.error('Failed to send chat:', error);
    }
  }

  async submitSet(gameId: string, cards: Card[], callback: (data: { success: boolean; message: string }) => void): Promise<void> {
    try {
      const result = await this.fetchAPI(`/games/${gameId}/sets`, {
        method: 'POST',
        body: JSON.stringify({ set: cards }),
      });
      callback(result);
    } catch (error) {
      callback({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to submit set'
      });
    }
  }

  async endGame(gameId: string, _user: User, callback: () => void): Promise<void> {
    if (this.gameEventSource) {
      this.gameEventSource.close();
      this.gameEventSource = null;
    }

    try {
      await this.fetchAPI(`/games/${gameId}/leave`, { method: 'POST' });
    } catch (error) {
      console.error('Failed to leave game:', error);
    } finally {
      callback();
    }
  }
}

export const socket = new APIClient();
