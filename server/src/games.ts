import { v4 as uuidv4 } from 'uuid';
import { Card } from '@set-game/shared';

interface FeedMessage {
  userId: string;
  type: 'join' | 'leave' | 'start' | 'set' | 'fail' | 'chat' | 'create';
  data: string | null;
}

interface GameOverviewData {
  id: string;
  name: string;
  members: string[];
  started: boolean;
  finished: boolean;
}

interface GameDetailedData {
  id: string;
  members: string[];
  cards: Card[];
  scores: Record<string, number>;
  feed: FeedMessage[];
  owner: string;
  started: boolean;
  finished: boolean;
}

interface Game {
  id: string;
  start: (userId: string) => boolean;
  addUser: (userId: string) => void;
  removeUser: (userId: string) => boolean;
  evaluateSet: (userId: string, cards: Card[]) => number;
  addFeedMessage: (userId: string, type: FeedMessage['type'], data: string | null) => void;
  getOverviewData: () => GameOverviewData;
  hasMembers: () => boolean;
  getDetailedData: () => GameDetailedData;
}

const createGame = (creatorId: string, gameName: string): Game => {
  const id = uuidv4();
  const name = gameName;
  const owner = creatorId;

  let board: Card[] = [];
  let deck: Card[] = [];
  let boardIndices: Record<Card, number> = {};

  let members: string[] = [];
  let scores: Record<string, number> = {};
  let feed: FeedMessage[] = [];

  // 0 - not started; 1 - in progress; 2 - complete
  let status = 0;

  const initDeck = (): void => {
    for (let i = 0; i < 3; ++i) {
      for (let j = 0; j < 3; ++j) {
        for (let k = 0; k < 3; ++k) {
          for (let l = 0; l < 3; ++l) {
            deck.push(`${i}${j}${k}${l}`);
          }
        }
      }
    }
  };

  const setBoardIndices = (): void => {
    boardIndices = {};
    for (let i = 0; i < board.length; ++i) {
      boardIndices[board[i]] = i;
    }
  };

  const drawThree = (first: number, second: number, third: number): boolean => {
    if (deck.length < 3) {
      return false;
    }

    if (first < 0 || second < 0 || third < 0) {
      return false;
    }

    first = Math.min(first, board.length);
    second = Math.min(second, board.length);
    third = Math.min(third, board.length);

    const card1 = deck.pop();
    const card2 = deck.pop();
    const card3 = deck.pop();

    if (!card1 || !card2 || !card3) return false;

    board.splice(first, 0, card1);
    board.splice(second, 0, card2);
    board.splice(third, 0, card3);

    setBoardIndices();

    return true;
  };

  const getSetCard = (card1: Card, card2: Card): Card => {
    const setCard: string[] = [];

    for (let i = 0; i < 4; i++) {
      const c1 = parseInt(card1[i]);
      const c2 = parseInt(card2[i]);

      if (c1 === c2) {
        setCard.push(card1[i]);
      } else {
        setCard.push(String(3 - c2 - c1));
      }
    }

    return setCard.join('');
  };

  const hasSet = (): boolean => {
    for (let i = 0; i < board.length; ++i) {
      for (let j = 0; j < board.length; ++j) {
        if (i === j) {
          continue;
        }

        const card1 = board[i];
        const card2 = board[j];
        const card3 = getSetCard(card1, card2);

        if (boardIndices[card3] !== undefined) {
          return true;
        }
      }
    }

    return false;
  };

  const shuffleDeck = (): Card[] => {
    let counter = deck.length;

    while (counter > 0) {
      const index = Math.floor(Math.random() * counter);
      counter--;
      const temp = deck[counter];
      deck[counter] = deck[index];
      deck[index] = temp;
    }

    return deck;
  };

  const start = (userId: string): boolean => {
    if (owner !== userId) {
      console.warn(`Non-owner user ${userId} attempted to start game ${id}`);
      return false;
    }

    status = 1;
    scores = members.reduce((obj, member) => {
      obj[member] = 0;
      return obj;
    }, {} as Record<string, number>);

    shuffleDeck();

    drawThree(0, 0, 0);
    drawThree(0, 0, 0);
    drawThree(0, 0, 0);
    drawThree(0, 0, 0);

    while (!hasSet()) {
      drawThree(board.length, board.length, board.length);
    }

    addFeedMessage(userId, 'start', null);

    return true;
  };

  const addUser = (userId: string): void => {
    members.push(userId);
    addFeedMessage(userId, 'join', null);
  };

  const removeUser = (userId: string): boolean => {
    const index = members.indexOf(userId);

    if (index !== -1) {
      members.splice(index, 1);
      addFeedMessage(userId, 'leave', null);
      return true;
    }

    return false;
  };

  const validateCard = (card: Card): boolean => {
    return (
      card.length === 4 &&
      Array.from(card).filter((element) => {
        const num = parseInt(element);
        return num >= 0 && num <= 2;
      }).length === 4
    );
  };

  const evaluateSet = (userId: string, cards: Card[]): number => {
    if (
      cards.length !== 3 ||
      !validateCard(cards[0]) ||
      !validateCard(cards[1]) ||
      !validateCard(cards[2])
    ) {
      return -1;
    }

    const indices = [
      boardIndices[cards[0]],
      boardIndices[cards[1]],
      boardIndices[cards[2]],
    ];

    if (indices.filter((index) => index === undefined).length !== 0) {
      return -2;
    }

    if (!scores[userId]) {
      scores[userId] = 0;
    }

    if (getSetCard(cards[0], cards[1]) === cards[2]) {
      indices.sort((a, b) => b - a);
      indices.forEach((index) => {
        board.splice(index, 1);
      });

      setBoardIndices();

      scores[userId] += 1;

      addFeedMessage(userId, 'set', `["${cards[0]}","${cards[1]}","${cards[2]}"]`);

      if (deck.length && board.length < 12) {
        drawThree(indices[2], indices[1], indices[0]);
      }

      while (!hasSet()) {
        if (!deck.length) {
          status = 2;
          return 2;
        }

        drawThree(board.length, board.length, board.length);
      }

      return 1;
    }

    scores[userId] -= 1;

    addFeedMessage(userId, 'fail', `["${cards[0]}","${cards[1]}","${cards[2]}"]`);
    return 0;
  };

  const addFeedMessage = (userId: string, type: FeedMessage['type'], data: string | null): void => {
    feed.push({ userId, type, data });
  };

  const hasMembers = (): boolean => Boolean(members.length);

  const getOverviewData = (): GameOverviewData => {
    return {
      id,
      name,
      members,
      started: status !== 0,
      finished: status === 2,
    };
  };

  const getDetailedData = (): GameDetailedData => {
    return {
      id,
      members,
      cards: board,
      scores,
      feed,
      owner,
      started: status !== 0,
      finished: status === 2,
    };
  };

  addFeedMessage(creatorId, 'create', null);
  initDeck();

  return {
    id,
    start,
    addUser,
    removeUser,
    evaluateSet,
    addFeedMessage,
    getOverviewData,
    hasMembers,
    getDetailedData,
  };
};

const games: Record<string, Game> = {};

export const getAllGames = (): Game[] => {
  return Object.values(games);
};

export const createNewGame = (creatorId: string, name: string): string => {
  const newGame = createGame(creatorId, name);
  games[newGame.id] = newGame;

  console.log(`Created game with id ${newGame.id} and name ${name}`);

  return newGame.id;
};

export const startGame = (id: string, userId: string): boolean => {
  if (!games[id]) {
    console.error(`Cannot start game with id ${id} - game does not exist`);
    return false;
  }

  const result = games[id].start(userId);

  console.log(`Started game with id ${id}`);

  return result;
};

export const addMemberToGame = (id: string, userId: string): boolean => {
  if (!games[id]) {
    console.error(`Cannot add user to game with id ${id} - game does not exist`);
    return false;
  }

  games[id].addUser(userId);

  console.log(`Added user ${userId} to game with id ${id}`);

  return true;
};

export const removeMemberFromGame = (id: string, userId: string): boolean => {
  if (!games[id]) {
    console.error(`Cannot remove user from game with id ${id} - game does not exist`);
    return false;
  }

  if (!games[id].removeUser(userId)) {
    console.error(`Cannot remove user with id ${userId} from game with id ${id} - user not in game`);
    return false;
  }

  console.log(`Removed user ${userId} from game with id ${id}`);

  return true;
};

export const evaluateSet = (id: string, userId: string, cards: Card[]): number => {
  if (!games[id]) {
    console.error(`Cannot evaluate set in game with id ${id} - game does not exist`);
    return -1;
  }

  const result = games[id].evaluateSet(userId, cards);

  console.log(`Evaluated set by user ${userId} in game ${id} with result ${result}`);

  return result;
};

export const addFeedMessage = (id: string, userId: string, type: FeedMessage['type'], data: string): boolean => {
  if (!games[id]) {
    console.error(`Cannot add feed message to game with id ${id} - game does not exist`);
    return false;
  }

  games[id].addFeedMessage(userId, type, data);

  console.log(`Added feed message to game with id ${id}`);

  return true;
};

export const getGameData = (id: string): GameDetailedData | null => {
  if (!games[id]) {
    console.error(`Cannot get game data for game with id ${id} - game does not exist`);
    return null;
  }

  return games[id].getDetailedData();
};

export const gameIsEmpty = (id: string): boolean => {
  if (!games[id]) {
    console.error(`Cannot check game members for game with id ${id} - game does not exist`);
    return false;
  }

  return !games[id].hasMembers();
};

export const deleteGame = (id: string): boolean => {
  if (!games[id]) {
    console.error(`Cannot delete game with id ${id} - game does not exist`);
    return false;
  }

  delete games[id];

  console.log(`Deleted game with id ${id}`);

  return true;
};
