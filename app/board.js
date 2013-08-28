var EventEmitter = require('events').EventEmitter,
    Q = require('q');

var Players = require('./players').Players,
    Player = require('./player').Player,
    Settlements = require('./settlements'),
    Roads = require('./roads'),
    DevelopmentCards = require('./development_cards'),
    utils = require('./utils'),
    components = require('./components');

exports.Board = Board;

function Board() {
    this.id = utils.createUniqueId();

    this.harbor_interSections = {
      stone: [-29,-30],
      wheat: [-25,-26],
      mystery: [-23,-22,-12,-13,-9,-10,-2,-3],
      wood: [-20,-19],
      brick: [-15,-16],
      sheep: [-5,-6]
    };
    
    // TODO change settlements and roads to be instances of
    // setttlements and roads classes.
    this.settlements = new Settlements();
    this.roads = new Roads();

    this.players = new Players();
}

Board.prototype.addUser = function (player) {
    var players = this.players;
    players.addPlayer(player);
    this.notify(player.name + ' joined the game');
    if (players.count() === 2) {
        this.initialize();
    }
};

Board.prototype.removeUser = function (id) {
    var player = this.players.getPlayer(id);
    console.log(player.name, 'has left the game');
    this.players.removePlayer(id);
};

Board.prototype.initialize = function () {
    // create new random board.
    var boardData,
        resourceMap = this.initResourceLocations(),
        diceMap = this.initResourceValues(resourceMap);

    this.resourceMap = resourceMap;
    this.diceMap = diceMap;

    boardData = {
        resourceMap: resourceMap,
        diceMap: diceMap,
        playerMap: this.players.getSerializablePlayerMap()
    };
    this.broadcast('setup', boardData);
    
    // start game
    this.firstRoll();
};

/**
 * figure out who is going first.
 */
Board.prototype.firstRoll = function () {
    var self = this,
        players = this.players,
        playerCount = players.count(),
        count = 0,
        max = 0,
        id;

    function rollHelper() {
        var player = players.getCurrent();
        self.roll(player)
            .then(function (diceValue) {
                if (diceValue > max) {
                    id = player.id;
                    max = diceValue;
                }
                if (++count < playerCount) {
                    console.log('count:', count, 'out of:', playerCount);
                    players.next();
                    rollHelper();
                } else {
                    console.log(players.getPlayer(id).name, 'goes first.');
                    players.setCurrent(id);
                    self.setup();
                }
            });
    }

    rollHelper();
};

Board.prototype.setup = function () {
    var players = this.players,
        self = this,
        playerCount = players.count(),
        count = 0;

    function setupHelper() {
        var player = players.getCurrent();
        self.chooseSettlement(player)
        .then(self.chooseRoad.bind(self))
        .then(function () {
            if (++count < 2 * playerCount) {
                if (count < playerCount) {
                    players.next();
                } else if (count > playerCount) {
                    players.previous();
                }
                setupHelper();
            }
        });
    }

    setupHelper();
};

Board.prototype.roll = function (player) {
    // return a promise. when we receive client message, resolve promise
    var self = this,
        rollDice = self.rollDice,
        deferred = Q.defer();
    player.socket.emit('roll');
    player.socket.once('roll', function () {
        var diceValue = rollDice();
        // broadcast dice value to everyone.
        self.notify(player.name + ' rolled ' + diceValue);
        deferred.resolve(diceValue, player.id);
    });

    return deferred.promise;
};

Board.prototype.chooseSettlement = function (player) {
    // return a promise. when we receive client message, resolve promise
    var self = this,
        deferred = Q.defer();
    player.socket.emit('choosesettlement');
    player.socket.once('choosesettlement', function (intersectionId) {
        console.log('placing settlement at', intersectionId);
        self.placeSettlement(player, intersectionId);
        deferred.resolve(player);
    });

    return deferred.promise;
};

Board.prototype.chooseCity = function (player) {
};

// currently depends on already having a starting position selected.
Board.prototype.chooseRoad = function (player) {
    var self = this,
        deferred = Q.defer();
    player.socket.emit('chooseroad');
    player.socket.once('chooseroad', function (edge) {
        console.log('placing road at', edge[0], edge[1]);
        self.placeRoad(player, edge);
        deferred.resolve(player);
    });
    return deferred.promise;
};

/**
 * Given a tile id, distributes resources to players
 * who have a settlement adjacent to that tile.
 * @param {number} tileId
 */
Board.prototype.distributeResources = function (tileId) {
    var self = this,
        // determine resource type
        resource = self.resourceMap[tileId],
        settlements = self.settlements,
        updateQueue = [],
        settlement,
        player,
        i;
    for (i = 0; i < settlements.length; i++) {
        settlement = settlements[i];
        if (settlement.intersection.indexOf(tileId) >= 0) {
            player = self.players.getPlayer(settlement.playerId);
            player.resources[resource] += settlement.type === 'city' ? 2 : 1;
            if (updateQueue.indexOf(playerId) < 0) {
                updateQueue.push(playerId);
            }
        }
    }
    // TODO notify players in update queue
    for (i = 0; i < updateQueue.length; i++) {
        player = self.players.getPlayer(updateQueue[i]);
        player.socket.emit('updateresources', player.resources);
    }
};

function trade(data) {
}

function build(data) {
    var buildMap = {
        settlement: this.buildSettlement,
        road: this.buildRoad,
        city: this.buildCity,
        devCard: this.buildDevCard
    };
    buildMap[data.type](data);
}

function devcard(data) {
    var devCardMap = {
        knight: knight,
        road_building: roadBuilding,
        monopoly: monopoly,
        year_of_plenty: yearOfPlenty,
        victory_point: function () {
            // add victory point.
        }
    };
}

var addListeners = function (player) {
    var socket = player.socket;
    socket.on('trade', trade);
    socket.on('build', build);
    socket.on('devcard', devcard);
};

var removeListeners = function (player) {
    var socket = player.socket;
    socket.removeAllListeners('trade');
    socket.removeAllListeners('build');
    socket.removeAllListeners('devcard');
};

Board.prototype.nextPlayer = function () {
    var self = this,
        players = this.players,
        player = players.getCurrent(),
        socket = player.socket;
    this.addListeners(socket);
    socket.emit('action', { path: 'helpers/action.html' });
    socket.once('endturn', function () {
        players.next();
        self.removeListeners(socket);
        self.nextPlayer();
    });
};

Board.prototype.pay = function (player, price) {
    var resources = player.resource,
        resource,
        quantity;
    // determine if player has sufficient resources
    for (resource in price) {
        if (price.hasOwnProperty(resource)) {
            quantity = price[resource];
            if (resources[resource] < quantity) {
                return false;
            }
        }
    }
    // make payment
    for (resource in price) {
        if (price.hasOwnProperty(resource)) {
            quantity = price[resource];
            resources[resource] -= quantity;
        }
    }
    return true;
};

Board.prototype.buildSettlement = function (player, intersectionId) {
    var cost = {
        brick: 1,
        wood: 1,
        wheat: 1,
        sheep: 1
    };
    if (this.pay(player, cost)) {
        // build this shit.
        this.placeSettlement(player, intersectionId);
    }
};

Board.prototype.buildCity = function (player, intersectionId) {
    var cost = {
        wheat: 2,
        stone: 3
    };
    if (this.pay(player, cost)) {
        // build this shit.
        this.placeSettlement(player, intersectionId);
    }
};

Board.prototype.buildRoad = function () {
};

Board.prototype.buildDevCard = function () {
};

Board.prototype.placeSettlement = function (player, intersectionId) {
    var settlement = {
        intersectionId: intersectionId,
        playerId: player.id
    };
    this.settlements.add(settlement);
    this.broadcast('update', {type: 'settlement', settlement: settlement});
};

Board.prototype.placeRoad = function (player, edge) {
    var road = {
        edge: edge,
        playerId: player.id
    };
    this.roads.add(road);
    this.broadcast('update', {type: 'road', road: road});
};

/**
 * placement methods must trigger propagate event.
 */
Board.prototype.isValidSettlement = function (player, intersectionId) {
    // Check to see if this is a valid settlement location.
    var intersectionMap = components.intersectionMap,
        settlements = this.settlements,
        roads = this.roads.byPlayerId(player.id),
        intersection = intersectionMap[intersectionId];
    if (!intersectionMap[intersectionId]) {
        return;
    }
    
    // check to see if location is legal
    //     - location is not occupied
    //     - at least 2 roads  away from any other settlement.
    var isLegal = settlements.every(function (settlement) {
        var otherIntersection = intersectionMap[settlement.intersectionId];
        var count = 0;
        otherIntersection.forEach(function (point) {
            if (intersection.indexOf(point) >= 0) {
                count++;
            }
        });
        return count < 2;
    });
    if (!isLegal) {
        return;
    }
    //     - player has a road that is connected
    isLegal = roads.some(function (road) {
        var roadIntersectionId = road.edge[0];
        if (roadIntersectionId === intersectionId) {
            return true;
        }
        roadIntersectionId = road.edge[1];
        if (roadIntersectionId === intersectionId) {
            return true;
        }
    });
    if (!isLegal) {
        return;
    }
    return true;
    // create new settlent and add to data structure.
};

Board.prototype.isValidRoad = function (player, start, end) {
    // Validate that the start and end locations are valid

    // check to see if location is legal
    //     - connecting to another road / settlement
    //     - not already an existing road here.
};

Board.prototype.placeCity = function (player, cityLocation) {
    // Check to see if this is a valid location

    // check to see if location is legal
    //     - player must have an existing settlement at location.
};

Board.prototype.transitionState = function () {
};

Board.prototype.initResourceLocations = function () {
    var resourceMap = {},
        tileIdArray = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18],
        locations = [],
        i,
        resource;
    while (tileIdArray.length) {
        locations.push(tileIdArray.splice(Math.floor(Math.random() * tileIdArray.length), 1)[0]);
    }
    for (i = 0; i < locations.length - 1; i++) {
        if (i < 4) {
            resource = 'wood';
        } else if (i < 8) {
            resource = 'wheat';
        } else if (i < 12) {
            resource = 'sheep';
        } else if (i < 15) {
            resource = 'stone';
        } else {
            resource = 'brick';
        }
        resourceMap[locations[i]] = {
            type: resource
        };
    }
    resourceMap[locations[18]] = {
        type: 'desert',
        value: 7
    };

    return resourceMap;
};

Board.prototype.initResourceValues = function (resourceMap) {
    var diceMap = {},
        resourceLocations = [],
        diceValues = [2,3,3,4,4,5,5,6,6,8,8,9,9,10,10,11,11,12],
        diceValue,
        locationId,
        resource,
        robber,
        i;
    diceValues = utils.shuffleArray(diceValues);
    for (locationId in resourceMap) {
        if (resourceMap.hasOwnProperty(locationId)) {
            if (resourceMap[locationId].type !== 'desert') {
                diceValue = diceValues.pop();
                if (!diceMap[diceValue]) {
                    diceMap[diceValue] = [];
                }
                diceMap[diceValue].push(locationId);
                resourceMap[locationId].value = diceValue;
            } else {
                diceMap[7] = [locationId];
            }
        }
    }
    return diceMap;
};

Board.prototype.rollDice = function () {
    return Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6) + 2;
};

/**
 * @param {string} msg
 * @param {string} [name]
 */
Board.prototype.notify = function (msg, name) {
    this.broadcast('sendchat', {name: name || '*** server ***', msg: msg});
};

Board.prototype.broadcast = function (channel, data) {
    var players = this.players.players,
        player,
        i;
    for (i = 0; i < players.length; i++) {
        player = players[i];
        player.socket.emit(channel, data);
    }
};
