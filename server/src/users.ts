import { uniqueNamesGenerator, colors, animals } from 'unique-names-generator';
import { User } from '@set-game/shared';

const generateNickname = (): string => {
  return uniqueNamesGenerator({
    dictionaries: [colors, animals],
    length: 2,
  });
};

const users: Record<string, User> = {};

export const addUser = (id: string, nickname?: string): User | null => {
  if (users[id]) {
    console.error(`Cannot add user with id ${id} - user already exists`);
    return null;
  }

  const user: User = {
    id,
    nickname: nickname || generateNickname(),
  };

  users[id] = user;

  console.log(`Created user '${user.nickname}'`);

  return user;
};

export const deleteUser = (id: string): boolean => {
  if (!users[id]) {
    console.error(`Cannot remove user with id ${id} - user does not exist`);
    return false;
  }

  const nickname = users[id].nickname;

  delete users[id];

  console.log(`Deleted user '${nickname}'`);

  return true;
};

export const getUser = (id: string): User | undefined => {
  if (!users[id]) {
    console.error(`Cannot get user with id ${id} - user does not exist`);
    return undefined;
  }

  return users[id];
};

export const getInactiveUsers = (): User[] => {
  const inactiveUsers = Object.values(users).filter((user) => !user.gameId);
  return inactiveUsers;
};
