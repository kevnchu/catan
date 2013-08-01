/*
var socket = io.connect(window.location.href);

// should this be moved into the require function?
$(document).ready(function () {
    socket.on('connect', function () {
        socket.emit('adduser', prompt("What's your name?"));

        // join or create new game
        $('#create-button').on('click', function () {
            socket.emit('createboard');
        });

        $('#join-button').on('click', function () {
            var boardId = prompt('Enter game id');
            socket.emit('joinboard', boardId);
        });
    });
});
*/

require(['view', 'board', 'player', 'utils'], function (view, Board, Player, utils) {
    /**
     * UI elements.
     */
    var chatInput = $('#chat-input'),
        chatBox = $('#chat-log'),
        chatButton = $('#chat-button'),
        controls = $('#action-container'),
        actionControls = $('#action-controls'),
        buildControls = $('#build-controls'),
        rollControls = $('#roll-controls'),
        tradeControls = $('#trade-controls'),
        submitButton = $('#submit-button');

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
            button = $(button);
            var buttonId = button.attr('id');
            buttonId = buttonId.split('-');
            buttonId.pop();
            var action = actionMap[buttonId.join('-')];
            button.on('click', function () {
                action.call(this);
            });
        });
    }

    registerControls(actionControls);
    registerControls(buildControls);

    var board = new Board();
    var player = new Player({playerId: 'foo'});

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
        board.configure(boardData);

        view.drawBoard(boardData, {size: 60});
        view.drawResourceKey();
    }

    // test {
    var s1 = {
        playerId: 'player1',
        type: 'settlement',
        intersection: [0,1,12]
    };
    var s2 = {
        playerId: 'player2',
        type: 'settlement',
        intersection: [0,-3]
    };
    var r1 = {
        playerId: 'player1',
        edge: [[1,12,13],[0,1,12]]
    };
    board.model.on('addSettlement', function (settlement) {
        view.drawSettlement(settlement);
    });

    board.model.on('addRoad', function (road) {
        view.drawRoad(road);
    });

    // }

    var socket = io.connect(window.location.href);

    socket.on('connect', function () {
        socket.emit('adduser', prompt("What's your name?"));

        // join or create new game
        $('#create-button').on('click', function () {
            socket.emit('createboard');
        });

        $('#join-button').on('click', function () {
            var boardId = prompt('Enter game id');
            socket.emit('joinboard', boardId);
        });
    });

    socket.on('adduser', function (id) {
        // set player id.
    });

    // chat
    socket.on('sendchat', function (data) {
        var line = document.createElement('div');
        var msg = document.createElement('span');
        var name = document.createElement('span');
        name.innerHTML = data.name + ': ';
        msg.innerHTML = data.msg;
        line.appendChild(name);
        line.appendChild(msg);
        chatBox.append(line);
    });

    chatInput.on('keypress', function (e) {
        if (e.which === 13) {
            var msg = chatInput.value;
            chatInput.value = '';
            socket.send(msg);
        }
    });

    chatButton.on('click', function (e) {
        var msg = chatInput.value;
        chatInput.value = '';
        socket.send(msg);
    });

    socket.on('playerupdate', function (data) {
        console.log('new player data ' + data);
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
        switch (data.type) {
            case 'settlement':
                console.log('LOG: board update. adding settlement', data.settlement);
                break;
            case 'road':
                console.log('LOG: board update. adding road', data.road);
                break;
            case 'city':
                break;
        }
    }

    function selectSettlementLocation() {
        alert('choose settlement');
        var token = pubsubz.subscribe('select-intersection', function (channel, intersectionId) {
            var settlement = {
                playerId: 'player1',
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
        var edge = [];
        var token = pubsubz.subscribe('select-intersection', function (channel, intersectionId) {
            var road;
            edge.push(intersectionId);
            alert(intersectionId);
            if (edge.length === 2) {
                road = {
                    playerId: 'player1',
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
});
