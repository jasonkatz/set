import { Response } from 'express';

interface SSEClient {
  id: string;
  res: Response;
}

class SSEManager {
  private lobbyClients: Map<string, SSEClient> = new Map();
  private gameClients: Map<string, Map<string, SSEClient>> = new Map();

  addLobbyClient(userId: string, res: Response): void {
    this.setupSSE(res);
    this.lobbyClients.set(userId, { id: userId, res });

    res.on('close', () => {
      this.lobbyClients.delete(userId);
      console.log(`Lobby SSE client ${userId} disconnected`);
    });

    console.log(`Lobby SSE client ${userId} connected`);
  }

  addGameClient(userId: string, gameId: string, res: Response): void {
    this.setupSSE(res);

    if (!this.gameClients.has(gameId)) {
      this.gameClients.set(gameId, new Map());
    }

    const gameClientsMap = this.gameClients.get(gameId)!;
    gameClientsMap.set(userId, { id: userId, res });

    res.on('close', () => {
      gameClientsMap.delete(userId);
      if (gameClientsMap.size === 0) {
        this.gameClients.delete(gameId);
      }
      console.log(`Game SSE client ${userId} disconnected from game ${gameId}`);
    });

    console.log(`Game SSE client ${userId} connected to game ${gameId}`);
  }

  broadcastToLobby(userIds: string[], event: string, data: any): void {
    const message = this.formatSSEMessage(event, data);

    for (const userId of userIds) {
      const client = this.lobbyClients.get(userId);
      if (client) {
        try {
          client.res.write(message);
        } catch (error) {
          console.error(`Error sending to lobby client ${userId}:`, error);
          this.lobbyClients.delete(userId);
        }
      }
    }
  }

  broadcastToGame(userIds: string[], event: string, data: any): void {
    const message = this.formatSSEMessage(event, data);

    for (const userId of userIds) {
      for (const [gameId, clients] of this.gameClients.entries()) {
        const client = clients.get(userId);
        if (client) {
          try {
            client.res.write(message);
          } catch (error) {
            console.error(`Error sending to game client ${userId}:`, error);
            clients.delete(userId);
          }
        }
      }
    }
  }

  broadcast(userIds: string[], event: string, data: any): void {
    if (event === 'LOBBY UPDATE') {
      this.broadcastToLobby(userIds, event, data);
    } else if (event === 'GAME UPDATE') {
      this.broadcastToGame(userIds, event, data);
    }
  }

  private setupSSE(res: Response): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    res.write(':ok\n\n');
  }

  private formatSSEMessage(event: string, data: any): string {
    return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  }
}

export const sseManager = new SSEManager();
