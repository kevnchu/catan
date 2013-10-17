module.exports = handleConnection;

var Board = require('./board'),
    Player = require('./player'),
    boards = {};

function handleConnection(socket) {
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
            socket.emit('error', 'Invalid board id.');
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
}
