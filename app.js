var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    handleConnection = require('./app/connection'),
    baseDir = __dirname + '/public';

app.configure(function () {
    app.use(app.router);
    app.use(express.static(baseDir));
    app.get('/', function (req, res) {
        res.sendfile(baseDir + '/index.html');
    });
    app.get('/join/:id', function (req, res) {
        var boardId = req.params.id;
        res.sendfile(baseDir + '/index.html');
    });
});

server.listen(8787);

io.sockets.on('connection', handleConnection);
