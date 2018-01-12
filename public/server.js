'use strict';

const express = require('express');
const SocketServer = require('ws').Server;
const path = require('path');

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');

const server = express()
    .use((req, res) => res.sendFile(INDEX) )
    .listen(PORT, () => console.log(`Listening on ${ PORT }`));

const wss = new SocketServer({ server });

var webSockets = {}; // userID: webSocket

wss.on('connection', (ws) => {
    console.log('Client connected');

    var userID = 1;//parseInt(ws.upgradeReq.url.substr(1), 10)
    webSockets[userID] = ws;
    //console.log('connected: ' + userID + ' in ' + Object.getOwnPropertyNames(webSockets));

    // Forward Message
    //
    // Receive               Example
    // [toUserID, text]      [2, "Hello, World!"]
    //
    // Send                  Example
    // [fromUserID, text]    [1, "Hello, World!"]
    ws.on('message', function(message) {
        console.log('received from ' + userID + ': ' + message);

        let data;
        try {
            data = JSON.parse(message);
        }
        catch (e) {
            console.log(e.message);
            ws.send(JSON.stringify({error: e.message}));
        }

        // var toUserWebSocket = webSockets[data.user_id];
        // if (toUserWebSocket) {
        //     console.log('sent to ' + data.user_id + ': ' + JSON.stringify(data));
        //     data.from_user_id = userID;
        //     toUserWebSocket.send(JSON.stringify(data));
        // }
    });

    ws.on('close', () => console.log('Client disconnected'));
});

setInterval(() => {
    wss.clients.forEach((client) => {
        client.send(new Date().toTimeString());
    });
}, 1000);
