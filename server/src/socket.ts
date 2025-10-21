import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import * as app from './app.js';

const connectedClients: Record<string, Socket> = {};

export const connect = (expressServer: HTTPServer): void => {
  const io = new SocketIOServer(expressServer, {
    transports: ['websocket', 'polling'],
    cors: {
      origin: ['http://localhost:5173', 'http://localhost:3000'],
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', clientConnected);

  // Set up broadcaster
  app.connectBroadcaster((clients, eventType, data) => {
    console.log(`Broadcasting ${eventType} to ${clients.length} clients`);

    for (const clientId of clients) {
      if (!connectedClients[clientId]) {
        console.warn(`Attempted to send message of type ${eventType} to unknown client ${clientId}`);
        continue;
      }
      connectedClients[clientId].emit(eventType, data);
    }
  });
};

const clientConnected = (socket: Socket): void => {
  console.log(`Received connection with id ${socket.id} from address ${socket.conn.remoteAddress}`);

  connectedClients[socket.id] = socket;
  connectedClients[socket.id].emit('CLIENT CONNECT ACK', true);

  socket.on('disconnect', () => {
    console.log(`Client with id ${socket.id} disconnected`);
    app.deleteUser(socket.id);
    delete connectedClients[socket.id];
  });

  socket.on('USER ENTER', (data: { nickname?: string }) => {
    const user = app.createUser(socket.id, data.nickname);

    const obj: any = {};

    if (!user) {
      obj.success = false;
      obj.errorMessage = 'Failed to create user';
      console.error(`Failed to create user for client with id ${socket.id}`);
    } else {
      obj.success = true;
      obj.nickname = user.nickname;
      console.log(`Client with id ${socket.id} logged in as ${obj.nickname}`);
    }

    connectedClients[socket.id].emit('USER ENTER ACK', obj);
  });

  socket.on('USER EXIT', () => {
    const success = Boolean(app.deleteUser(socket.id));

    if (!success) {
      console.error(`Failed to log out client with id ${socket.id}`);
    } else {
      console.log(`Client with id ${socket.id} logged out`);
    }

    connectedClients[socket.id].emit('USER EXIT ACK', success);
  });

  socket.on('LOBBY LIST', () => {
    const data = app.getLobbyData();
    connectedClients[socket.id].emit('LOBBY LIST ACK', data);
  });

  socket.on('LOBBY LIST END', () => {
    // Client is leaving lobby, no action needed
  });

  socket.on('GAME CREATE', (data: { name: string }) => {
    const gameData = app.createGame(socket.id, data.name);
    connectedClients[socket.id].emit('GAME CREATE ACK', gameData);
  });

  socket.on('GAME JOIN', (data: { id: string }) => {
    const success = app.joinGame(data.id, socket.id);
    connectedClients[socket.id].emit('GAME JOIN ACK', success);
  });

  socket.on('GAME UPDATE INIT', (data: { id: string }) => {
    app.triggerGameUpdate(data.id);
  });

  socket.on('GAME START', (data: { id: string }) => {
    const success = app.startGame(data.id, socket.id);
    connectedClients[socket.id].emit('GAME START ACK', success);
  });

  socket.on('GAME LEAVE', (data: { id: string }) => {
    const success = app.leaveGame(data.id, socket.id);
    connectedClients[socket.id].emit('GAME LEAVE ACK', success);
  });

  socket.on('GAME SET', (data: { id: string; set: string[] }) => {
    const result = app.evaluateSet(data.id, socket.id, data.set);
    connectedClients[socket.id].emit('GAME SET ACK', result);
  });

  socket.on('GAME FEED', (data: { id: string; type: 'chat'; message: string }) => {
    app.sendGameFeedMessage(data.id, socket.id, data.type, data.message);
  });
};
