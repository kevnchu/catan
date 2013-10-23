var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    session = require('./app/session'),
    baseDir = __dirname + '/public';

app.configure(function () {
    app.use(app.router);
    app.use(express.static(baseDir));
});

app.get('/', function (req, res) {
    res.sendfile(baseDir + '/index.html');
});

app.get('/board*', function (req, res) {
    var boardId = req.query.id;
    if (boardId) {
        if (session.isValidId(boardId)) {
            res.sendfile(baseDir + '/board.html');
        } else {
            res.end('Invalid board id.');
        }
    } else {
        boardId = session.createSession();
        res.redirect('/board.html?id=' + boardId);
    }
});

server.listen(8787);
io.sockets.on('connection', session.handleConnection);
