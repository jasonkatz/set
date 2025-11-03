// Card representation: 4-digit string where each digit is 0-2
// representing: [shape, color, count, fill]
export type Card = string;

export interface User {
  id: string;
  nickname: string;
  gameId?: string | null;
}

export interface GameOverview {
  id: string;
  name: string;
  members: string[]; // User nicknames in overview
  started: boolean;
  finished: boolean;
}

export interface FeedMessage {
  username: string;
  msgType: 'join' | 'leave' | 'start' | 'set' | 'fail' | 'chat' | 'create';
  data: string | null;
}

export interface GameState {
  id: string;
  name?: string;
  members: string[]; // User IDs
  cards: Card[];
  scores: Record<string, number>; // nickname -> score
  feed: FeedMessage[];
  owner: string; // nickname
  started: boolean;
  finished: boolean;
  selected?: Record<string, boolean>;
}

export interface LobbyData {
  clients: string[]; // User IDs
  users: string[]; // User nicknames
  games: GameOverview[];
}

// Socket.io event payloads
export interface UserEnterPayload {
  nickname?: string;
}

export interface UserEnterResponse {
  success: boolean;
  user?: User;
  error?: string;
}

export interface UserExitPayload {
  id: string;
  nickname: string;
}

export interface GameJoinPayload {
  id: string; // game ID
}

export interface GameJoinResponse {
  success: boolean;
  error?: string;
}

export interface GameCreatePayload {
  name: string;
}

export interface GameCreateResponse {
  success: boolean;
  id?: string;
  error?: string;
}

export interface GameStartPayload {
  id: string; // game ID
}

export interface GameStartResponse {
  success: boolean;
  error?: string;
}

export interface GameSetPayload {
  id: string; // game ID
  set: Card[]; // 3 cards
}

export interface GameSetResponse {
  success: boolean;
  message: string;
}

export interface GameFeedPayload {
  id: string; // game ID
  message: string;
}

export interface GameLeavePayload {
  id: string; // game ID
  user: User;
}

export interface GameUpdateInitPayload {
  id: string; // game ID
}
