'use strict';

const express = require('express');
const WebSocketServer = require('ws').Server;
const path = require('path');

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');

const server = express()
    .use((req, res) => res.sendFile(INDEX) )
    .listen(PORT, () => console.log(`Listening on ${ PORT }`));

const jwtToken = 'someTokenStringGenerateByJWT';

const wss = new WebSocketServer({
    server: server,
    /**
     * TODO: Header response from server
     */
    // options: {
    //     headers: {
    //         'X-AUTH-TOKEN': jwtToken,
    //     },
    // },

    /**
     * TODO: Verify JWT AUTH token
     */
    // verifyClient: function(info, done) {
    //     let query = url.parse(info.req.url, true).query;
    //     jwt.verify(query.token, config.jwt.secret, function(err, decoded) {
    //         if (err) return done(false, 403, 'Not valid token');
    //
    //         // Saving the decoded JWT on the client would be nice
    //         done(true);
    //     });
    // }
});

var webSockets = {}; // userID: webSocket

wss.on('connection', (ws) => {
    console.log('Client connected');

    var userId = ws.upgradeReq.headers['raadaar_user'];
    console.log(userId);
    if (userId == undefined) {
        ws.on('message', function(message) {
            ws.send(JSON.stringify({error: 403, msg: 'Not authentification'}));
        });
    }
    else {
        webSockets[userId] = ws;
        console.log('connected: ' + userId);

        ws.on('message', function (message) {
            let messageData;
            try {
                messageData = JSON.parse(message);

                var wsTo = webSockets[messageData.to_user];
                if (wsTo) {
                    messageData.from_user = userId;
                    messageData.to_user = undefined;
                    wsTo.send(JSON.stringify(messageData));
                }
            }
            catch (e) {
                ws.send(JSON.stringify({err: 500, msg: e.message}));
            }
        });
    }

    ws.on('close', function(close) {
        console.log('Client disconnected');
    });
});
