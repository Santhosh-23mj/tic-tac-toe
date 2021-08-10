const http = require('http');
const express = require('express');
const path = require('path');
const socketIo = require('socket.io');

const app = express();
const httpServer = http.createServer(app);
const io = socketIo(httpServer);

const port = normalizePort(process.env.PORT || '3000');

httpServer.listen(port, () => {
    console.log(`[INFO] Listening on port - ${port}`)
});
httpServer.on('error', onError);

app.use(express.static(path.join(__dirname, "public")))

module.exports.io = io;

// a bit of a hack load ticTacToeSocketService which will share io object
require('./services/ticTacToeSocketService');

//
// Normalize port number to an Integer
//
function normalizePort(val) {
    const port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

//
// Handle errors while binding to a PORT
//
function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    const bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}