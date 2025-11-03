import 'dotenv/config';
import express from 'express';
import cookieSession from 'cookie-session';
import cors from 'cors';
import consoleStamp from 'console-stamp';
import router from './routes.js';
import { sseManager } from './sse.js';
import * as appLogic from './app.js';

consoleStamp(console, {
  format: ':date(mm-dd-yyyy HH:MM:ss.l)',
});

const requiredEnvVars = ['GAME_PASSWORD', 'SESSION_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

// Parse allowed origins from environment variable
const allowedOrigins = isProduction
  ? (process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || [])
  : ['http://localhost:5173', 'http://localhost:3000'];

if (isProduction && allowedOrigins.length === 0) {
  console.error('Missing required environment variable: ALLOWED_ORIGINS. ' +
    'Please set it to a comma-separated list of allowed origins (e.g., https://set.jasonkatz.dev,https://api.set.jasonkatz.dev)');
  process.exit(1);
}

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json());

app.use(cookieSession({
  name: 'session',
  keys: [process.env.SESSION_SECRET || 'set-game-secret-change-in-production'],
  maxAge: 24 * 60 * 60 * 1000,
  secure: isProduction,
  httpOnly: true,
  sameSite: isProduction ? 'none' : 'lax',
}));

app.use(router);

appLogic.connectBroadcaster((clientIds, event, data) => {
  console.log(`Broadcasting ${event} to ${clientIds.length} clients`);
  sseManager.broadcast(clientIds, event, data);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server listening on *:${PORT}`);
  console.log(`Environment: ${isProduction ? 'production' : 'development'}`);
});
