import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import consoleStamp from 'console-stamp';
import * as socket from './socket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Add timestamps to console logs
consoleStamp(console, {
  format: ':date(mm-dd-yyyy HH:MM:ss.l)',
});

const app = express();

// Serve static files from the client build directory in production
// In development, Vite dev server will handle the client
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  const clientBuildPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientBuildPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 3000;

const expressServer = app.listen(PORT, () => {
  console.log(`Server listening on *:${PORT}`);
  console.log(`Environment: ${isProduction ? 'production' : 'development'}`);
});

socket.connect(expressServer);
