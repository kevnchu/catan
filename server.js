// node dependencies
var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    path = require('path');

// Application dependencies
var Board = require('./js/board').Board;
// for now create a single board...
var board = new Board();

server.listen(8787);

app.get('/', function (req, res) {
    res.sendfile(__dirname + '/index.html');
});

//app.use(express.static(path.join(__dirname, '/lib')));
//app.use(express.static(path.join(__dirname, '/images')));

app.get('/lib/*', function (req, res) {
    res.sendfile(path.join(__dirname, req.url));
});

app.get('/images/*', function (req, res) {
    res.sendfile(path.join(__dirname, req.url));
});

io.sockets.on('connection', function (socket) {
    var name;
    socket.on('adduser', function (data) {
        name = data;
        if (name) {
            // Not sure if this is good practice?
            // XXX temp
            //board.addUser({name: name, socket: socket});
            var mockBoard = {
                settlements: [{
                    type: 'settlement',
                    location: [1,12,13],
                    playerId: 'b'
                }],
                roads: [{
                    playerId: 'b',
                    edge: [[1,12,13],[0,1,12]]
                }],
                robber: null
            };
            socket.emit('updateboard', mockBoard);
        }
    });
    // anything dealing with game logic should be handled by board.
//    socket.on('readLocation', function (data) {
//        console.log('Location: ' + data);
//    });
    socket.on('message', function (message, callback) {
        console.log('LOG: ' + name + ': ' + message);
        // Propagate message to all clients.
        io.sockets.emit('sendchat', {name: name, msg: message});
    });
    socket.on('disconnect', function () {
        console.log('LOG: Disconnect by user');
    });

});

//board.on('updateboard', function (data) {
//    io.sockets.emit('updateboard', data);
//});
