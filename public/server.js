'use strict';

const express = require('express');
const socketIO = require('socket.io');
const path = require('path');

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');

const server = express()
  .use((req, res) => res.sendFile(INDEX) )
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

const io = socketIO(server);

let webSockets = new Map();

io.on('connection', (socket) => {
    console.log('Client connected');

    var userId = socket.request.headers['raadaar-user'];
    if (userId == undefined) {
        console.log('Unauthorized');
        socket.emit('message', {error: 401, msg: 'Unauthorized'});
        socket.disconnect();
    }
    else {
        socket.username = userId;
        webSockets[userId] = socket;

        socket.on('message', function (message) {
            let messageData;
            try {
                messageData = JSON.parse(message);

                if (messageData.to_user == undefined) {
                    console.log('Missing required to_user');
                    socket.emit('error', {error:422, msg: 'Missing required to_user'});
                }

                let socketTo = webSockets[messageData.to_user];
                if (socketTo) {
                    messageData.from_user = userId;
                    messageData.to_user = undefined;
                    socketTo.emit('notification', messageData);
                }
            }
            catch (e) {
                console.log(e.message);
                socket.emit('error', {err: 500, msg: e.message});
            }
        });
    }

    socket.on('disconnect', function () {
        console.log('Client disconnected');
        webSockets[socket.username] = undefined;
    });
});

//setInterval(() => io.emit('time', new Date().toTimeString()), 1000);
