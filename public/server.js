var io = require('socket.io').listen(8080); 

function getClients () {
    let clientsList = [];

    for (let client in io.sockets.connected) {
        clientsList.push(client);
    }

    return clientsList;
}

io.sockets.on('connection', function (socket) {
    try {
        console.log('connected');
        var userId = (socket.id).toString();
        var time = (new Date).toLocaleTimeString();
        
        socket.json.send({'event': 'connected', 'name': userId, 'time': time});
        
        socket.broadcast.json.send({'event': 'user joined', 'name': userId, 'time': time});
        
        console.log('Clients: ' + getClients());

        socket.on('message', function (msg) {
            try {
                var message = JSON.parse(msg);
                if (message.to_user) {
                    io.to(message.to_user).emit(message.text);
                    console.log('message sent!');
                }
            } catch (e) {
                console.log('ERR: ' + e);
            }   
        });
        
        socket.on('disconnect', function() {
            var time = (new Date).toLocaleTimeString();
            io.sockets.json.send({'event': 'userSplit', 'name': userId, 'time': time});
        });

    } catch (e) {
        console.log('ERR: ' + e);
    }
});