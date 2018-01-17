var logger = require('heroku-logger');

var io = require('socket.io').listen(3000);

function getClients () {
    let clientsList = [];
    for (let client in io.sockets.connected) {
        clientsList.push(client);
    }
    return clientsList;
}

// const radarUserConnections = new Map();

io.sockets.on('connection', function (socket) {
    try {
        console.log('connected');
        logger.info('connected');

        var userId = (socket.id).toString();
        var time = (new Date).toLocaleTimeString();

        socket.json.emit('message', {'action': 'connection', 'id': userId, 'time': time});

        //socket.broadcast.json.send({'event': 'user joined', 'name': userId, 'time': time});
        //console.log('Clients: ' + getClients());
        logger.info('Clients: '+getClients());

        socket.on('message', function (msg) {
            try {
                var message = JSON.parse(msg);
                if (message.to) {
                    let toConnect = message.to;
                    message.to = undefined;
                    io.to(toConnect).json.send(message);
                    logger.info('Clients: '+getClients());
                }
            } catch (e) {
                socket.json.emit('exception', {err: 500, msg: e.message});
                console.log('Exception: ' + e.message);
                logger.error('Exception: ' + e.message);
            }
        });

        socket.on('exception', function(data) {
            socket.json.send('exception', data);
        });

        // socket.on('get clients', function(data) {
        //     socket.json.send('exception', data);
        // });

        socket.on('disconnect', function() {
            //var time = (new Date).toLocaleTimeString();
            console.log('disconnect client');
            logger.info('disconnect client');
        });

    } catch (e) {
        console.log('ERR: ' + e);
        logger.error('ERR: `msg`', { argument: 'msg', value: e.message })
    }
});