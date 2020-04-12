const socketIO = require('socket.io');
const app = require('./app');

const connect = expressServer => {
    const io = socketIO(expressServer);
    io.set('transports', ['websocket']);
    io.on('connection', clientConnected);
};

const connectedClients = {};

const clientConnected = socket => {
    console.log(`Received connection with id ${socket.id} from address ${socket.client.conn.remoteAddress}`);

    connectedClients[socket.id] = socket;
    connectedClients[socket.id].emit('CLIENT CONNECT ACK', true);

    socket.on( 'disconnect', async () => {
        console.log(`Client with id ${socket.id} disconnected`);

        await app.deleteUser(socket.id);

        delete connectedClients[socket.id]
    });

    socket.on( 'USER ENTER', async data => {
        const user = await app.createUser(socket.id, data.nickname);

        const obj = {};

        if (!user) {
            obj.success = false;
            obj.errorMessage = 'Failed to create user';

            console.error(`Failed to create user for client with id ${socket.id}`);
        } else {
            obj.success = true;
            obj.nickname = user.nickname;

            console.log(`Client with id ${socket.id} logged in as ${obj.nickname}`);
        };

        connectedClients[socket.id].emit( 'USER ENTER ACK', obj );
    });

    socket.on( 'USER EXIT', async data => {
        const success = Boolean(await app.deleteUser(socket.id));

        if (!success) {
            console.error(`Failed to log out client with id ${socket.id}`);
        } else {
            console.log(`Client with id ${socket.id} logged out`);
        }

        connectedClients[socket.id].emit('USER EXIT ACK', success);
    });

    socket.on( 'LOBBY LIST', async () => {
        const data = await app.getLobbyData();

        connectedClients[socket.id].emit('LOBBY LIST ACK', data);
    });

    socket.on( 'GAME CREATE', async data => {
        const gameData = await app.createGame(socket.id, data.name);

        connectedClients[socket.id].emit('GAME CREATE ACK', gameData);
    });

    socket.on( 'GAME JOIN', async data => {
        const success = await app.joinGame(data.id, socket.id);

        connectedClients[socket.id].emit('GAME JOIN ACK', success);
    });

    socket.on( 'GAME UPDATE INIT', async data => {
        const gameData = await app.triggerGameUpdate(data.id);
    });

    socket.on( 'GAME START', async data => {
        const success = await app.startGame(data.id, socket.id);

        connectedClients[socket.id].emit('GAME START ACK', success);
    });

    socket.on( 'GAME LEAVE', async data => {
        const success = await app.leaveGame(data.id, socket.id);

        connectedClients[socket.id].emit('GAME LEAVE ACK', success);
    });

    socket.on( 'GAME SET', async data => {
        const result = await app.evaluateSet(data.id, socket.id, data.set);

        connectedClients[socket.id].emit('GAME SET ACK', result);
    });

    socket.on( 'GAME FEED', async data => {
        await app.sendGameFeedMessage(data.id, socket.id, data.type, data.message);
    });
};

app.connectBroadcaster((clients, eventType, data) => {
    console.log(`Broadcasting ${eventType} to ${clients}`);

    for (const clientId of clients) {
        if (!connectedClients[clientId]) {
            console.warn(`Attempted to send message of type ${eventType} to unknown client`);
            return;
        }
        connectedClients[clientId].emit(eventType, data);
    }
});

module.exports = {
    connect,
};
