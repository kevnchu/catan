var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    fs = require('fs'),
    browserify = require('browserify'),
    Board = require('./app/board'),
    Player = require('./app/player'),
    baseDir = __dirname + '/public',
    boards = {};

server.listen(8787);

app.configure(function () {
    var output = fs.createWriteStream(baseDir + '/bundle.js'),
        b = browserify();
    b.add(baseDir + '/js/soc.js');
    b.bundle().pipe(output);
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
        socket.emit('adduser', player.serialize());
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

    // where should this be handled.
    socket.on('message', function (msg) {
        //var board = boardId && boards[boardId];
        var board = boards[1];
        if (player && board) {
            // Propagate message to players in same game.
            board.notify(msg, player.name);
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
            // XXX broken because we're mocking board
            //boards[boardId].removeUser(player.id);
        }
    });
};

io.sockets.on('connection', handleConnection);
