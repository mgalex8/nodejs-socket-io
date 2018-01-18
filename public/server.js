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
    let data = [];
    radarUsers.forEach(function(value, key) {
        data.push(key+":"+value);
    });
    return data;
}

function getHeaders(headers) {
    let data = [];
    for (let header in headers) {
        data.push(header +':'+headers[header]);
    }
    return data;
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
        //logger.info('headers: ' + getHeaders(socket.request.headers));

        socket.auth = false;

        // // let userId = socket.request.headers['raadaar_userid'];
        // if (userId == undefined) {
        //     socket.json.emit('exception', {err: 401, msg: 'Unauthorized'});
        //     logger.error('Unauthorized connection');
        // }
        // else {
            let sid = (socket.id).toString();
            let time = (new Date).toLocaleTimeString();

            socket.on('authenticate', function(data){
                logger.info('auth');
                if (data.raadaar_userid !== undefined) {
                    socket.emit('authenticate', {'action': 'connection', 'time': time});

                    socket.auth = true;
                    socket.radarUserId = data.raadaar_userid;
                    radarUsers.set(data.raadaar_userid, sid);

                    // logger.info("Authenticated socket " + socket.id);
                    // logger.info('Users: ' + getUsers());
                }
            });

            // set raadaar userId connection
            // radarUsers.set(userId, sid);

            //socket.broadcast.json.send({'event': 'user joined', 'name': userId, 'time': time});
            //logger.info('Clients: ' + getClients());

            socket.on('message', function (msg) {
                try {
                    var message = msg;
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
        // }

        socket.on('exception', function(data) {
            socket.json.send('exception', data);
        });

        // socket.on('get clients', function(data) {
        //     socket.json.send('exception', data);
        // });

        socket.on('disconnect', function() {
            if (radarUsers.has(socket.radarUserId)) {
                radarUsers.delete(socket.radarUserId);
            }
            //var time = (new Date).toLocaleTimeString();
            logger.info('disconnect client');
        });

    } catch (e) {
        logger.error('ERR: `msg`', { argument: 'msg', value: e.message });
    }

    setTimeout(function() {
        //If the socket didn't authenticate, disconnect it
        if (!socket.auth) {
          socket.disconnect('unauthorized');
        }
    }, 10000);

});