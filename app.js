// node dependencies
var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    path = require('path'),
    baseDir = __dirname + '/public';

// Application dependencies.
var Board = require('./app/board').Board,
    Player = require('./app/player').Player,
    utils = require('./app/utils');


var boards = {};

server.listen(8787);

app.configure(function () {
    app.use(app.router);
    app.use(express.static(baseDir));
});

app.get('/', function (req, res) {
    res.sendfile(baseDir + '/index.html');
});

var handleConnection = function (socket) {
    var boardId,
        player;

    socket.on('adduser', function (name) {
        player = new Player(name, socket);
        socket.emit('adduser', player.id);
    });

    // add to existing game or create new one.
    socket.on('joinboard', function (boardId) {
        // XXX
        //var board = boards[boardId];
        var board = boards[1];
        if (board) { 
            board.addUser(player);
            socket.emit('joinboard', boardId);
        } else {
            // invalid board Id
        }
    });

    socket.on('createboard', function () {
        var board = new Board();
        boardId = board.id;
        // XXX
        //boards[boardId] = board;
        boards[1] = board;
        board.addUser(player);
        socket.emit('joinboard', boardId);
    });

    socket.on('disconnect', function () {
        if (boardId && player) {
            // remove user from board
            boards[boardId].removeUser(player.id);
        }
    });
};

io.sockets.on('connection', handleConnection);

/*
io.sockets.on('connection', function (socket) {
    var uid,
        name;
    socket.on('adduser', function (data) {
        name = data;
        if (name) {
            uid = utils.createUniqueId();
            console.log('add new user:', name);
            // Not sure if this is good practice to pass in socket.
            board.addUser({playerId: uid, name: name, socket: socket});
        }
    });
    socket.on('message', function (message, callback) {
        console.log('LOG:', name, ':', message);
        // Propagate message to all clients.
        io.sockets.emit('sendchat', {name: name, msg: message});
    });
    socket.on('disconnect', function () {
        if (uid) {
            console.log('LOG: Disconnect by user');
            board.removeUser(uid);
        }
    });
});

board.on('setup', function (boardData) {
    io.sockets.emit('setup', boardData);
});

board.on('ready', function () {
    io.sockets.emit('ready');
});

board.on('notify', function (msg) {
    io.sockets.emit('sendchat', {name: '*** server ***', msg: msg});
});
*/
