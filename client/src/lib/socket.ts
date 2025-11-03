import type {
  LobbyData,
  GameState,
  Card,
  User,
} from '@set-game/shared';
import { config } from '../env.js';

const API_BASE = config.apiUrl;
const VERCEL_BYPASS_TOKEN = config.vercelBypassToken;

class APIClient {
  private lobbyAbortController: AbortController | null = null;
  private gameAbortController: AbortController | null = null;

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (VERCEL_BYPASS_TOKEN) {
      headers['x-vercel-protection-bypass'] = VERCEL_BYPASS_TOKEN;
    }

    return headers;
  }

  private async streamSSE(endpoint: string, callback: (eventType: string, data: any) => void, abortController: AbortController): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        credentials: 'include',
        headers: this.getHeaders(),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`SSE request failed: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let eventType = '';
        let eventData = '';

        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventType = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            eventData = line.slice(5).trim();
          } else if (line === '' && eventType && eventData) {
            try {
              const data = JSON.parse(eventData);
              callback(eventType, data);
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
            eventType = '';
            eventData = '';
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('SSE stream error:', error);
      }
    }
  }

  private async fetchAPI(endpoint: string, options?: RequestInit) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      credentials: 'include',
      headers: {
        ...this.getHeaders(),
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
    if (this.lobbyAbortController) {
      this.lobbyAbortController.abort();
    }

    this.lobbyAbortController = new AbortController();
    this.streamSSE('/lobby/stream', (eventType, data) => {
      if (eventType === 'LOBBY UPDATE') {
        callback(data);
      }
    }, this.lobbyAbortController);
  }

  endLobby(): void {
    if (this.lobbyAbortController) {
      this.lobbyAbortController.abort();
      this.lobbyAbortController = null;
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
    if (this.gameAbortController) {
      this.gameAbortController.abort();
    }

    this.gameAbortController = new AbortController();
    this.streamSSE(`/games/${gameId}/stream`, (eventType, data) => {
      if (eventType === 'GAME UPDATE') {
        callback(data);
      }
    }, this.gameAbortController);
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
    if (this.gameAbortController) {
      this.gameAbortController.abort();
      this.gameAbortController = null;
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
