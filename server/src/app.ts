import * as users from './users.js';
import * as games from './games.js';
import { LobbyData, Card } from '@set-game/shared';

type Broadcaster = (clientIds: string[], event: string, data: any) => void;

let broadcast: Broadcaster;

export const connectBroadcaster = (broadcaster: Broadcaster): void => {
  broadcast = broadcaster;
};

export const createUser = (id: string, nickname?: string) => {
  const user = users.addUser(id, nickname);

  sendLobbyUpdate();

  return user;
};

export const deleteUser = (id: string) => {
  const user = users.getUser(id);
  if (!user) {
    return;
  }

  const gameId = user.gameId;
  if (gameId) {
    leaveGame(gameId, id);
  }

  const result = users.deleteUser(id);

  sendLobbyUpdate();

  return result;
};

export const getUserNickname = (id: string): string => {
  const user = users.getUser(id);
  if (!user) {
    return 'unnamed user';
  }

  return user.nickname;
};

export const getLobbyData = (): LobbyData => {
  const inactiveUsers = users.getInactiveUsers();
  const allGames = games.getAllGames();

  const lobbyData: LobbyData = {
    clients: inactiveUsers.map((user) => user.id),
    users: inactiveUsers.map((user) => user.nickname),
    games: allGames.map((game) => {
      const overview = game.getOverviewData();
      return {
        ...overview,
        members: overview.members.map((id) => {
          const user = users.getUser(id);
          return user ? user.nickname : id;
        }),
      };
    }),
  };

  return lobbyData;
};

export const createGame = (creatorId: string, name: string) => {
  const id = games.createNewGame(creatorId, name);

  joinGame(id, creatorId);

  sendLobbyUpdate();

  return { id };
};

export const joinGame = (gameId: string, userId: string): boolean => {
  if (!games.addMemberToGame(gameId, userId)) {
    console.error(`Error adding player with id ${userId} to game with id ${gameId}`);
    return false;
  }

  const user = users.getUser(userId);
  if (!user) {
    console.error(`Error getting user with id ${userId}`);
    return false;
  }

  user.gameId = gameId;

  sendLobbyUpdate();
  sendGameUpdate(gameId);

  return true;
};

export const leaveGame = (gameId: string, userId: string): boolean => {
  if (!games.removeMemberFromGame(gameId, userId)) {
    console.error(`Error removing player with id ${userId} from game with id ${gameId}`);
    return false;
  }

  const user = users.getUser(userId);
  if (user) {
    user.gameId = null;
  }

  sendGameUpdate(gameId);

  if (games.gameIsEmpty(gameId)) {
    games.deleteGame(gameId);
  }

  sendLobbyUpdate();

  return true;
};

export const triggerGameUpdate = (gameId: string): void => {
  sendGameUpdate(gameId);
};

export const startGame = (gameId: string, userId: string): boolean => {
  const result = games.startGame(gameId, userId);

  if (result) {
    sendGameUpdate(gameId);
    sendLobbyUpdate();
  }

  return result;
};

export const evaluateSet = (gameId: string, userId: string, cards: Card[]) => {
  const rc = games.evaluateSet(gameId, userId, cards);

  let result = {
    message: '',
    success: false,
  };

  switch (rc) {
    case -2:
      result.message = 'Cards are not on the board';
      result.success = false;
      break;
    case -1:
      result.message = 'Cards are formatted incorrectly';
      result.success = false;
      break;
    case 0:
      result.message = 'Invalid set';
      result.success = false;
      break;
    case 1:
      result.message = 'Valid set; game not yet finished';
      result.success = true;
      break;
    case 2:
      result.message = 'Valid set; game finished';
      result.success = true;
      break;
    default:
      result.message = 'Unknown return code from set evaluation';
      result.success = false;
      break;
  }

  if (rc >= 0) {
    sendGameUpdate(gameId);
    sendLobbyUpdate();
  }

  return result;
};

export const sendGameFeedMessage = (
  gameId: string,
  userId: string,
  type: 'chat',
  message: string
): void => {
  games.addFeedMessage(gameId, userId, type, message);
  sendGameUpdate(gameId);
};

export const getGameData = (gameId: string) => {
  const gameData = games.getGameData(gameId);

  if (!gameData) {
    return null;
  }

  const owner = users.getUser(gameData.owner);
  const ownerNickname = owner ? owner.nickname : gameData.owner;

  const scoresByNickname: Record<string, number> = {};
  Object.keys(gameData.scores).forEach((userId) => {
    const user = users.getUser(userId);
    if (user) {
      scoresByNickname[user.nickname] = gameData.scores[userId];
    }
  });

  const feedWithNicknames = gameData.feed.map((message) => {
    const user = users.getUser(message.userId);
    return {
      username: user ? user.nickname : message.userId,
      msgType: message.type,
      data: message.data,
    };
  });

  return {
    ...gameData,
    owner: ownerNickname,
    scores: scoresByNickname,
    feed: feedWithNicknames,
  };
};

const sendLobbyUpdate = (): void => {
  const data = getLobbyData();
  broadcast(data.clients, 'LOBBY UPDATE', data);
};

const sendGameUpdate = (gameId: string): void => {
  const data = getGameData(gameId);
  if (!data) {
    return;
  }

  broadcast(data.members, 'GAME UPDATE', data);
};
