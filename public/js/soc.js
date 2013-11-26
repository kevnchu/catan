var view = require('./view'),
    Board = require('./board'),
    utils = require('./utils'),
    board,
    player,
    socket;

function createSocket() {
    var socket = io.connect(location.origin);
    initSocket(socket);
    return socket;
}

function initSocket(socket) {
    var handlerMap = {
            'adduser': initPlayer,
            'sendchat': receiveMessage,
            'updatedevcards': updateDevCards,
            'updateresources': updateResources,
            'start': startTurn,
            'notify': notify,
            'setup': setup,
            'roll': roll,
            'robber': moveRobber,
            'steal': steal,
            'trade': function (resources) {
                view.updateStatus('Player is offering', printResources(resources));
                $('.submit-trade-button').removeClass('hidden');
            },
            'confirmtrade': function (resources) {
                view.updateStatus('confirm trade for', printResources(resources));
                $('.confirm-trade-button').removeClass('hidden');
            },
            'update': updateBoard,
            'settlement': placeSettlement,
            'road': placeRoad
        },
        channel;

    socket.on('connect', function () {
        var boardId = location.search.split('=').pop();
        socket.emit('adduser', prompt("What's your name?"));
        socket.emit('joinboard', boardId);
    });

    socket.on('disconnect', function () {
        view.updateStatus('Disconnected from server');
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
    view.updateStatus('');
    board = new Board(boardData);
    view.drawBoard(boardData, {size: 60});
    view.drawResources(player.resources);
}

function registerControls(context) {
    // maps buttons to click handlers
    var clickHandlerMap = {
        ready: ready,
        roll: handleRoll,
        build: build,
        sendChat: sendChat,
        confirmTrade: confirmTrade,
        submitTrade: submitTrade,
        initiateTrade: initiateTrade,
        endTurn: endTurn,
        buildSettlement: buildSettlement,
        buildRoad: buildRoad,
        buildCity: '',
        buildDevCard: buildDevCard,
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
    $('.action-controls button').removeClass('hidden');
}

function endTurn() {
    socket.emit('end');
    $('.action-controls button, .build-controls button').addClass('hidden');
}

function notify(data) {
    alert(data.msg);
}

function sendChat() {
    var chatInput = $('.chat-input'),
        msg = chatInput[0].value;
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
    alert('roll the dice.');
    $('.roll-button').removeClass('hidden');
}

function handleRoll() {
    socket.emit('roll');
    $('.roll-button').addClass('hidden');
}

function ready() {
    socket.emit('ready');
    $('#ready-button').addClass('hidden');
    view.updateStatus('Waiting');
}

function build(e) {
    $('.build-controls button').toggleClass('hidden');
}

function updateDevCards(devCards) {
    player.devCards = devCards;
    view.drawDevCards(devCards);
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
        case 'player':
            board.player = data.player;
            view.updatePlayerInfo(data.player);
            break;
        case 'robber':
            board.moveRobber(data.tileId);
            view.moveRobber(data.tileId);
            break;
    }
}

function initiateTrade() {
    alert('select player to trade with');
    var token = pubsubz.subscribe('select-player', function (channel, playerId) {
        view.highlightPlayer(playerId);
        alert('Select resources to trade');
        $('.submit-trade-button').removeClass('hidden');
        pubsubz.unsubscribe(token);
    });
}

function submitTrade() {
    var selectedResources = $('.resource-card.highlight'),
        selectedPlayer = $('.player-info.highlight'),
        resources = {},
        playerId;
    selectedResources.each(function (i, cardNode) {
        var resourceType = cardNode.dataset.resourceType;
        if (!resources[resourceType]) {
            resources[resourceType] = 0;
        }
        resources[resourceType] += 1;
    });
    if (selectedPlayer.length) {
        playerId = selectedPlayer[0].dataset.playerId;
        view.clearHighlightedPlayers();
    }
    socket.emit('trade', {resources: resources, playerId: playerId});
    $('.submit-trade-button').addClass('hidden');
}

function confirmTrade() {
    socket.emit('confirmtrade');
    $('.confirm-trade-button').addClass('hidden');
}

function buildSettlement() {
    var resources = player.resources;
    if (resources.brick >= 1 && resources.sheep >= 1 && 
        resources.wheat >= 1 && resources.wood >= 1) {
        placeSettlement();
    } else {
        alert('you don\'t have the resources to build a settlement');
    }
}

function buildRoad() {
    var resources = player.resources;
    if (resources.brick >= 1 && resources.wood >= 1) {
        placeRoad();
    } else {
        alert('you don\'t have the resources to build a road');
    }
}

function buildDevCard() {
    var resources = player.resources;
    if (resources.sheep >= 1 && resources.stone >= 1 && resources.wheat >= 1) {
        socket.emit('devcard');
    } else {
        alert('you don\'t have the resources to build a development card');
    }
}

function showValidIntersections() {
    var intersections = board.getValidIntersections(player.id);
    view.highlightIntersections(intersections);
}

/**
 * 
 * @param {string} [intersectionId]
 */
function showValidEdges(intersectionId) {
    var edges = board.getValidEdges(player.id, intersectionId);
    view.highlightEdges(edges);
}

function placeSettlement() {
    alert('choose settlement');
    showValidIntersections();
    var token = pubsubz.subscribe('select-intersection', function (channel, intersectionId) {
        if (board.isValidSettlement(player.id, intersectionId)) {
            var settlement = {
                playerId: player.id,
                type: 'settlement',
                intersectionId: intersectionId
            };
            view.clearHighlighted();
            view.drawSettlement(settlement);
            socket.emit('settlement', intersectionId);
            pubsubz.unsubscribe(token);
        } else {
            alert('You can\'t place a settlement there.');
        }
    });
}

/**
 * @param {string} [intersectionId]
 */
function placeRoad(intersectionId) {
    alert('choose road.');
    showValidEdges(intersectionId);
    var token = pubsubz.subscribe('select-edge', function (channel, edge) {
        if (board.isValidRoad(player.id, edge)) {
            var road = {
                playerId: player.id,
                edge: edge
            };
            view.clearHighlighted();
            view.drawRoad(road);
            socket.emit('road', edge);
            pubsubz.unsubscribe(token);
        } else {
            alert('You can\'t place a road there');
        }
    });
}

function moveRobber() {
    alert('Move the robber');
    var token = pubsubz.subscribe('select-tile', function (channel, tileId) {
        view.moveRobber(tileId);
        socket.emit('robber', tileId);
        pubsubz.unsubscribe(token);
    });
}

function steal(players) {
    alert('choose player to steal resources from');
    var playerMap = board.playerMap;
    var token = pubsubz.subscribe('select-player', function (channel, playerId) {
        socket.emit('steal', playerId);
        pubsubz.unsubscribe(token);
    });
}

function printResources(resources) {
    var resource,
        count,
        str = [];
    for (resource in resources) {
        count = resources[resource];
        str.push(count + ' ' + resource);
    }
    return str.join(', ');
}

socket = createSocket();
registerControls($('.board-controls'));
registerControls($('.chat-controls'));
$('.chat-input').on('keypress', function (e) {
    if (e.which === 13) {
        sendChat();
    }
});
