var express = require( 'express' );
var http = require( 'http' );
var socketIO = require( 'socket.io' );
var net = require( 'net' );
var path = require( 'path' );


/*
 * Express
 */
var app = express();
app.use(express.static(path.join(__dirname, "../public_html")));
var expressServer = app.listen(3000, function() {
    console.log( 'listening on *:3000' );
});


/*
 * Node - Java Socket Connection
 */
// Utility function to create messages with id numbers (used for acks)
var msgCount = 0;
var createMessage = function( msgType, data ) {
    var obj = {
        msgId: msgCount++,
        msgType: msgType,
        data: data
    }
    console.log( 'Sending message: ' );
    console.log( obj );
    return obj;
};

// Node-Java socket connection event handling
const client = net.connect( 1010, 'localhost' );
client.on( 'connect', function() {
    // 'connect' listener
    var obj = createMessage( "nodeConnect", { msg: "connected to server!" } );
    client.write( JSON.stringify( obj ) + '\n' );
});
client.on( 'data', function( msg ) {
    var msgObj = JSON.parse(msg.toString());
    console.log( 'Processed message ' + msgObj.msgId + ': ' + msgObj.msgType + (msgObj.msgType == "ack" ? (' for message ' + msgObj.data.ackNum) : '') );
});
client.on( 'end', function() {
    console.log( 'disconnected from server' );
});


/*
 * Node - Browser Socket Connection (socket.io)
 */
var io = require( 'socket.io' ).listen( expressServer );
io.on( 'connection', function( socket ) {
    var obj = createMessage( 'CLIENT CONNECT', { clientId: socket.id } );
    client.write( JSON.stringify( obj ) + '\n' );

    socket.on( 'disconnect', function() {
        var obj = createMessage( 'CLIENT DISCONNECT', { clientId: socket.id } );
        client.write( JSON.stringify( obj ) + '\n' );
    });

    socket.on( 'USER REGISTER', function(data) {
        var obj = createMessage( 'USER REGISTER', {
            username: data.username,
            password: data.password,
            confirmPassword: data.confirmPassword
        });
        client.write( JSON.stringify( obj ) + '\n' );
    });
});
