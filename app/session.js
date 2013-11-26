module.exports = {
    handleConnection: handleConnection,
    isValidId: isValidId,
    createSession: createSession
};

var Board = require('./board'),
    Player = require('./player'),
    createUniqueId = require('./utils').createUniqueId,
    boards = {};

function handleConnection(socket) {
    var boardId,
        player;

    socket.on('adduser', function (name) {
        // FIXME just keep reference to socket.id
        player = new Player(name, socket);
        socket.emit('adduser', player.serialize());
    });

    socket.on('joinboard', function (id) {
        var board;
        boardId = id;
        board = boards[boardId];
        if (board) { 
            if (!board.addUser) {
                board = boards[boardId] = new Board(boardId);
            }
            board.addUser(player);
            socket.emit('joinboard', boardId);
        } else {
            socket.emit('error', 'Invalid board id.');
        }
    });

    socket.on('message', function (msg) {
        var board = boardId && boards[boardId];
        if (player && board) {
            board.notify(msg, player.name);
        }
    });

    socket.on('disconnect', function () {
        var board = boardId && boards[boardId];
        if (board && player) {
            board.removeUser(player.id);
        }
    });
}

function isValidId(boardId) {
    return !!boards[boardId];
}

function createSession() {
    var id = createUniqueId();
    boards[id] = true;
    return id;
}
