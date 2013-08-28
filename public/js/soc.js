var view = require('./view'),
    Board = require('./board'),
    utils = require('./utils'),
    chatInput = $('#chat-input'),
    chatBox = $('#chat-log'),
    chatButton = $('#chat-button'),
    controls = $('#action-container'),
    actionControls = $('#action-controls'),
    buildControls = $('#build-controls'),
    rollControls = $('#roll-controls'),
    tradeControls = $('#trade-controls'),
    submitButton = $('#submit-button'),
    board,
    player,
    socket;

socket = io.connect(window.location.href);

socket.on('connect', function () {
    socket.emit('adduser', prompt("What's your name?"));

    $('#create-button').on('click', function () {
        socket.emit('createboard');
    });

    $('#join-button').on('click', function () {
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
    chatBox.append(line);
});

socket.on('updateresources', function (resources) {
    player.resources = resources;
    view.drawResources(resources);
});
socket.on('startturn', function () {
    console.log('starting your turn');
    // enable controls.
});
socket.on('endturn', function () {
    console.log('your turn is now over');
    // disable controls.
});
socket.on('action', function (type) {
    var controlMap = {
        roll: roll
    };
    controlMap[type]();
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

chatButton.on('click', sendChat);

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

    $('#board-container').removeClass('hidden');
    board = new Board(boardData);

    view.drawBoard(boardData, {size: 60});
    view.drawResourceKey();
}

function registerControls(controls) {
    // maps button ids to functions
    var actionMap = {
        build: build,
        roll: roll,
        //trade: trade,
        //devcard: devcard,
        //end: endTurn,
        'build-settlement': buildSettlement,
        'build-road': buildRoad
        //'build-city': buildCity,
        //'build-devcard': buildDevCard
    };
    $('button', controls).each(function (i, button) {
        var buttonId,
            action;
        button = $(button);
        buttonId = button.attr('id').split('-');
        buttonId.pop();
        action = actionMap[buttonId.join('-')];
        button.on('click', function () {
            action.call(this);
        });
    });
}

function sendChat() {
    var msg = chatInput[0].value;
    chatInput[0].value = '';
    if (msg)
        socket.send(msg);
}

function roll() {
    alert('roll the dice.');
    rollControls.removeClass('hidden');
    rollControls.on('click', function (e) {
        socket.emit('roll');
    });
}

function build(e) {
    buildControls.removeClass('hidden');
}

function updateBoard(data) {
    // update board model.
    
    // update view
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

function buildSettlement() {
    var message = $('<p>').text('Choose your settlement intersection.');
    $('#options-container').append(message);
    // listen to click location.       
}

function buildRoad() {
    var message = $('<p>').text('Choose your road start and end intersections.');
    $('#options-container').append(message);
}

function buildCity() {
    var message = $('<p>').text('Choose a settlement to upgrade.');
    $('#options-container').append(message);
}

registerControls(actionControls);
registerControls(buildControls);
