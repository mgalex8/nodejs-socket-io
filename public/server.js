var io = require('socket.io').listen(8080); 

// function getClients () {
//     let clientsList = [];
//     for (let client in io.sockets.connected) {
//         clientsList.push(client);
//     }
//     return clientsList;
// }

// const radarUserConnections = new Map();

io.sockets.on('connection', function (socket) {
    try {
        console.log('connected');
        var userId = (socket.id).toString();
        var time = (new Date).toLocaleTimeString();
        
        socket.json.emit('message', {'action': 'connection', 'id': userId, 'time': time});
        
        //socket.broadcast.json.send({'event': 'user joined', 'name': userId, 'time': time});
        //console.log('Clients: ' + getClients());

        socket.on('message', function (msg) {
            try {
                var message = JSON.parse(msg);
                if (message.to) {
                    let toConnect = message.to;
                    message.to = undefined;
                    io.to(toConnect).json.send(message);
                }
            } catch (e) {
                socket.json.emit('exception', {err: 500, msg: e.message});
                console.log('ERR: ' + e);
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
        });

    } catch (e) {
        console.log('ERR: ' + e);
    }
});