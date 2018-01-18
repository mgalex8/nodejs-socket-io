'use strict';


//var io = require('socket.io').listen(3000);

const express = require('express');
const socketIO = require('socket.io');
const path = require('path');
const logger = require('heroku-logger');

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');

const server = express()
  .use((req, res) => res.sendFile(INDEX) )
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

const io = socketIO(server);

const radarUsers = new Map();

/**
 * [getClients description]
 *
 * @return Array
 */
function getClients () {
    let clientsList = [];
    for (let client in io.sockets.connected) {
        clientsList.push(client);
    }
    return clientsList;
}

function getUsers() {
    radarUsers.forEach(function(value, key) {

    });
}

/**
 * Socket.io connection event
 *
 * @param  Socket socket) {
 * @return void
 */
io.sockets.on('connection', function (socket) {
    try {
        logger.info('connected');

        let userId = socket.request.headers['raadaar-userid'];
        if (userId == undefined) {
            socket.json.emit('exception', {err: 401, msg: 'Unauthorized'});
            logger.error('Exception: ' + e.message);
        }
        else {
            let sid = (socket.id).toString();
            let time = (new Date).toLocaleTimeString();
            socket.emit('message', {'action': 'connection', 'id': sid, 'time': time});

            // set raadaar userId connection
            radarUsers.set(userId, sid);

            //socket.broadcast.json.send({'event': 'user joined', 'name': userId, 'time': time});
            logger.info('Clients: '+getClients());
            logger.info('Users: '+getUsers());

            socket.on('message', function (msg) {
                try {
                    var message = JSON.parse(msg);
                    if (message.to) {
                        let toConnect = radarUsers.get(message.to);
                        message.from = message.to;
                        message.to = undefined;

                        io.to(toConnect).json.send(message);
                    }
                } catch (e) {
                    socket.json.emit('exception', {err: 500, msg: e.message});
                    logger.error('Exception: ' + e.message);
                }
            });
        }

        socket.on('exception', function(data) {
            socket.json.send('exception', data);
        });

        // socket.on('get clients', function(data) {
        //     socket.json.send('exception', data);
        // });

        socket.on('disconnect', function() {
            radarUsers.delete(userId);
            //var time = (new Date).toLocaleTimeString();
            logger.info('disconnect client');
        });

    } catch (e) {
        logger.error('ERR: `msg`', { argument: 'msg', value: e.message });
    }
});