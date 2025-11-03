import { Router, Request, Response, NextFunction } from 'express';
import * as app from './app.js';
import { sseManager } from './sse.js';

const router = Router();

declare module 'express-session' {
  interface SessionData {
    userId: string;
    nickname: string;
  }
}

interface AuthRequest extends Request {
  session: Request['session'] & {
    userId?: string;
    nickname?: string;
  };
}

const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.session.userId) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  next();
};

router.post('/auth/login', (req: AuthRequest, res: Response) => {
  const { nickname, password } = req.body;

  if (!password || password !== process.env.GAME_PASSWORD) {
    res.status(401).json({ success: false, error: 'Invalid password' });
    return;
  }

  const userId = req.sessionID;
  const user = app.createUser(userId, nickname);

  if (!user) {
    res.status(500).json({ success: false, error: 'Failed to create user' });
    return;
  }

  req.session.userId = userId;
  req.session.nickname = user.nickname;

  req.session.save((err) => {
    if (err) {
      console.error('Session save error:', err);
      res.status(500).json({ success: false, error: 'Failed to save session' });
      return;
    }

    console.log(`User ${user.nickname} (${userId}) logged in`);
    res.json({ success: true, user });
  });
});

router.post('/auth/logout', requireAuth, (req: AuthRequest, res: Response) => {
  const userId = req.session.userId!;
  const success = Boolean(app.deleteUser(userId));

  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction error:', err);
    }
  });

  console.log(`User ${userId} logged out`);

  res.json({ success });
});

router.get('/lobby', requireAuth, (req: AuthRequest, res: Response) => {
  const data = app.getLobbyData();
  res.json(data);
});

router.get('/lobby/stream', requireAuth, (req: AuthRequest, res: Response) => {
  const userId = req.session.userId!;
  sseManager.addLobbyClient(userId, res);

  const initialData = app.getLobbyData();
  res.write(`event: LOBBY UPDATE\ndata: ${JSON.stringify(initialData)}\n\n`);
});

router.post('/games', requireAuth, (req: AuthRequest, res: Response) => {
  const { name } = req.body;
  const userId = req.session.userId!;

  if (!name) {
    res.status(400).json({ success: false, error: 'Game name is required' });
    return;
  }

  const result = app.createGame(userId, name);
  res.json({ success: true, ...result });
});

router.get('/games/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const gameData = app.getGameData(id);

  if (!gameData) {
    res.status(404).json({ error: 'Game not found' });
    return;
  }

  res.json(gameData);
});

router.get('/games/:id/stream', requireAuth, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.session.userId!;

  const gameData = app.getGameData(id);
  if (!gameData) {
    res.status(404).json({ error: 'Game not found' });
    return;
  }

  sseManager.addGameClient(userId, id, res);

  res.write(`event: GAME UPDATE\ndata: ${JSON.stringify(gameData)}\n\n`);
});

router.post('/games/:id/join', requireAuth, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.session.userId!;

  const success = app.joinGame(id, userId);

  if (!success) {
    res.status(400).json({ success: false, error: 'Failed to join game' });
    return;
  }

  res.json({ success: true });
});

router.post('/games/:id/leave', requireAuth, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.session.userId!;

  const success = app.leaveGame(id, userId);

  if (!success) {
    res.status(400).json({ success: false, error: 'Failed to leave game' });
    return;
  }

  res.json({ success: true });
});

router.post('/games/:id/start', requireAuth, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.session.userId!;

  const success = app.startGame(id, userId);

  if (!success) {
    res.status(403).json({ success: false, error: 'Only game owner can start the game' });
    return;
  }

  res.json({ success: true });
});

router.post('/games/:id/sets', requireAuth, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { set } = req.body;
  const userId = req.session.userId!;

  if (!set || !Array.isArray(set)) {
    res.status(400).json({ success: false, error: 'Invalid set format' });
    return;
  }

  const result = app.evaluateSet(id, userId, set);
  res.json(result);
});

router.post('/games/:id/messages', requireAuth, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { message } = req.body;
  const userId = req.session.userId!;

  if (!message) {
    res.status(400).json({ success: false, error: 'Message is required' });
    return;
  }

  app.sendGameFeedMessage(id, userId, 'chat', message);
  res.json({ success: true });
});

export default router;
