import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import consoleStamp from 'console-stamp';
import router from './routes.js';
import { sseManager } from './sse.js';
import * as appLogic from './app.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

consoleStamp(console, {
  format: ':date(mm-dd-yyyy HH:MM:ss.l)',
});

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

app.use(cors({
  origin: isProduction ? true : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET || 'set-game-secret-change-in-production',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: isProduction,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: isProduction ? 'none' : 'lax',
  },
}));

app.use(router);

appLogic.connectBroadcaster((clientIds, event, data) => {
  console.log(`Broadcasting ${event} to ${clientIds.length} clients`);
  sseManager.broadcast(clientIds, event, data);
});

if (isProduction) {
  const clientBuildPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientBuildPath));

  app.get('/*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server listening on *:${PORT}`);
  console.log(`Environment: ${isProduction ? 'production' : 'development'}`);
});
