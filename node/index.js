const express = require( 'express' );
const path = require( 'path' );

const socket = require('./socket');

require('console-stamp')(console, 'mm-dd-yyyy HH:MM:ss.l');

const server = express();
server.use(express.static(path.join(__dirname, "../public_html")));
const expressServer = server.listen(3000, () => {
    console.log( 'listening on *:3000' );
});

socket.connect(expressServer);
