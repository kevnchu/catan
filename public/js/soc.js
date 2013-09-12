var view = require('./view'),
    Board = require('./board'),
    utils = require('./utils'),
    chatInput = $('.chat-input'),
    actionControls = $('.action-controls'),
    buildControls = $('.build-controls'),
    board,
    player,
    socket;

socket = io.connect(window.location.href);

socket.on('connect', function () {
    socket.emit('adduser', prompt("What's your name?"));

    $('.create-board').on('click', function () {
        socket.emit('createboard');
    });

    $('.join-board').on('click', function () {
        var boardId = prompt('Enter game id');
        socket.emit('joinboard', boardId);
    });
});

socket.on('adduser', function (_player) {
    player = _player;
});

socket.on('sendchat', function (data) {
    var line = document.createElement('div'),
        msg = document.createElement('span'),
        name = document.createElement('span');
    name.innerHTML = data.name + ': ';
    msg.innerHTML = data.msg;
    line.appendChild(name);
    line.appendChild(msg);
    $('.chat-log').append(line);
});

socket.on('updateresources', function (resources) {
    player.resources = resources;
    view.drawResources(resources);
});
socket.on('startturn', function () {
    alert('your turn');
    actionControls.removeClass('hidden');
});
socket.on('endturn', function () {
});
socket.on('message', function (data) {
    alert(data.msg);
});
socket.on('setup', setup);
socket.on('roll', roll);
socket.on('update', updateBoard);
socket.on('choosesettlement', selectSettlementLocation);
socket.on('chooseroad', selectRoad);

chatInput.on('keypress', function (e) {
    if (e.which === 13) {
        sendChat();
    }
});

function setup(boardData) {
    var tileDiceValueMap = {},
        diceMap = boardData.diceMap,
        diceValue,
        tiles,
        i;

    for (diceValue in diceMap) {
        if (diceMap.hasOwnProperty(diceValue)) {
            tiles = diceMap[diceValue];
            for (i = 0; i < tiles.length; i++) {
                tileDiceValueMap[tiles[i]] = diceValue;
            }
        }
    }
    boardData.tileDiceValueMap = tileDiceValueMap;

    $('.board-container').removeClass('hidden');
    board = new Board(boardData);

    view.drawBoard(boardData, {size: 60});
    view.drawResourceKey();
    view.drawResources(player.resources);
}

function registerControls(context) {
    // maps buttons to click handlers
    var clickHandlerMap = {
        build: build,
        sendChat: sendChat,
        trade: '',
        endTurn: '',
        buildSettlement: '',
        buildRoad: '',
        buildCity: '',
        buildDevCard: '',
        playDevCard: ''
    };
    $('button', context).each(function (i, button) {
        var buttonId,
            handler;
        button = $(button);
        buttonId = button.attr('data-click');
        handler = clickHandlerMap[buttonId];
        if (handler) {
            button.on('click', function () {
                handler.call(this);
            });
        }
    });
}

function sendChat() {
    var msg = chatInput[0].value;
    chatInput[0].value = '';
    if (msg)
        socket.send(msg);
}

function roll() {
    var rollButton = $('.roll-button');
    alert('roll the dice.');
    rollButton.removeClass('hidden');
    rollButton.on('click', function (e) {
        socket.emit('roll');
        rollButton.addClass('hidden');
    });
}

function build(e) {
    buildControls.removeClass('hidden');
}

function updateBoard(data) {
    switch (data.type) {
        case 'settlement':
            board.addSettlement(data.settlement);
            view.drawSettlement(data.settlement);
            break;
        case 'road':
            board.addRoad(data.road);
            view.drawRoad(data.road);
            break;
        case 'city':
            board.addCity(data.city);
            view.drawCity(data.city);
            break;
    }
}

function selectSettlementLocation() {
    alert('choose settlement');
    var token = pubsubz.subscribe('select-intersection', function (channel, intersectionId) {
        var settlement = {
            playerId: player.id,
            type: 'settlement',
            intersectionId: intersectionId
        };
        view.drawSettlement(settlement);
        socket.emit('choosesettlement', intersectionId);
        pubsubz.unsubscribe(token);
    });
}

function selectRoad() {
    alert('choose road.');
    var edge = [],
        token = pubsubz.subscribe('select-intersection', function (channel, intersectionId) {
            var road;
            edge.push(intersectionId);
            alert(intersectionId);
            if (edge.length === 2) {
                road = {
                    playerId: player.id,
                    edge: edge
                };
                view.drawRoad(road);
                socket.emit('chooseroad', edge);
                pubsubz.unsubscribe(token);
            }
        });
}

registerControls($('.board-controls'));
registerControls($('.chat-controls'));
