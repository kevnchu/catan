var view = require('./view'),
    Board = require('./board'),
    utils = require('./utils'),
    chatInput = $('.chat-input'),
    actionControls = $('.action-controls'),
    buildControls = $('.build-controls'),
    board,
    player,
    socket;

function createSocket() {
    var socket = io.connect(window.location.href);
    initSocket(socket);
    return socket;
}

function initSocket(socket) {
    var handlerMap = {
            'adduser': initPlayer,
            'sendchat': receiveMessage,
            'updateresources': updateResources,
            'start': startTurn,
            'message': alertMessage,
            'setup': setup,
            'roll': roll,
            'update': updateBoard,
            'settlement': selectSettlementLocation,
            'chooseroad': selectRoad
        },
        channel;

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

    for (channel in handlerMap) {
        if (handlerMap.hasOwnProperty(channel)) {
            socket.on(channel, handlerMap[channel]);
        }
    }
}

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
        endTurn: endTurn,
        buildSettlement: buildSettlement,
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

function initPlayer(_player) {
    player = _player;
}

function startTurn() {
    alert('Your turn');
    actionControls.removeClass('hidden');
}

function endTurn() {
    socket.emit('end');
    $('.action-controls, .build-controls').hide();
}

function alertMessage(data) {
    alert(data.msg);
}

function sendChat() {
    var msg = chatInput[0].value;
    chatInput[0].value = '';
    if (msg)
        socket.send(msg);
}

function receiveMessage(data) {
    var line = document.createElement('div'),
        msg = document.createElement('span'),
        name = document.createElement('span');
    name.innerHTML = data.name + ': ';
    msg.innerHTML = data.msg;
    line.appendChild(name);
    line.appendChild(msg);
    $('.chat-log').append(line);
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
    $('.build-controls').toggleClass('hidden');
}

function updateResources(resources) {
    player.resources = resources;
    view.drawResources(resources);
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

function buildSettlement() {
    // check to see we have enough resources.
    var resources = player.resources;
    if (resources.brick >= 1 && resources.sheep >= 1 && 
        resources.wheat >= 1 && resources.wood >= 1) {
        selectSettlementLocation();
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
        socket.emit('settlement', intersectionId);
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

socket = createSocket();
registerControls($('.board-controls'));
registerControls($('.chat-controls'));
chatInput.on('keypress', function (e) {
    if (e.which === 13) {
        sendChat();
    }
});
