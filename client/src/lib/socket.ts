import { io, Socket } from 'socket.io-client';
import type {
  LobbyData,
  GameState,
  Card,
  User,
} from '@set-game/shared';

class SocketClient {
  private socket: Socket;

  constructor() {
    this.socket = io({
      transports: ['websocket', 'polling'],
    });

    this.socket.on('reconnect_attempt', () => {
      this.socket.io.opts.transports = ['polling', 'websocket'];
    });
  }

  listenForError(callback: () => void): void {
    this.socket.on('connect_error', callback);
  }

  enter(nickname: string, password: string, callback: (data: { success: boolean; nickname?: string; errorMessage?: string }) => void): void {
    this.socket.emit('USER ENTER', { nickname, password });
    this.socket.once('USER ENTER ACK', callback);
  }

  exit(user: User, callback: (success: boolean) => void): void {
    this.socket.emit('USER EXIT', user);
    this.socket.once('USER EXIT ACK', callback);
  }

  startLobby(callback: (data: LobbyData) => void): void {
    this.socket.emit('LOBBY LIST');
    this.socket.once('LOBBY LIST ACK', callback);
    this.socket.on('LOBBY UPDATE', callback);
  }

  endLobby(): void {
    this.socket.off('LOBBY UPDATE');
    this.socket.emit('LOBBY LIST END');
  }

  joinGame(gameId: string, callback: (success: boolean) => void): void {
    this.socket.emit('GAME JOIN', { id: gameId });
    this.socket.once('GAME JOIN ACK', callback);
  }

  createGame(name: string, callback: (data: { id: string }) => void): void {
    this.socket.emit('GAME CREATE', { name });
    this.socket.once('GAME CREATE ACK', callback);
  }

  startGame(gameId: string, callback: (success: boolean) => void): void {
    this.socket.emit('GAME START', { id: gameId });
    this.socket.once('GAME START ACK', callback);
  }

  gameUpdate(gameId: string, callback: (data: GameState) => void): void {
    this.socket.emit('GAME UPDATE INIT', { id: gameId });
    this.socket.on('GAME UPDATE', callback);
  }

  sendChat(gameId: string, message: string): void {
    this.socket.emit('GAME FEED', { id: gameId, type: 'chat', message });
  }

  submitSet(gameId: string, cards: Card[], callback: (data: { success: boolean; message: string }) => void): void {
    this.socket.emit('GAME SET', { id: gameId, set: cards });
    this.socket.once('GAME SET ACK', callback);
  }

  endGame(gameId: string, user: User, callback: () => void): void {
    this.socket.off('GAME UPDATE');
    this.socket.emit('GAME LEAVE', { id: gameId, user });
    this.socket.once('GAME LEAVE ACK', callback);
  }
}

export const socket = new SocketClient();
