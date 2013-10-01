module.exports = Board;

var Q = require('q'),
    Players = require('./players'),
    Settlements = require('./settlements'),
    Roads = require('./roads'),
    DevelopmentCards = require('./development_cards'),
    utils = require('./utils'),
    components = require('./components');

function Board() {
    this.id = utils.createUniqueId();
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
    this.notify(player.name + ' has left the game');
    this.players.removePlayer(id);
};

Board.prototype.initialize = function () {
    var self = this,
        players = self.players,
        resourceMap = self.resourceMap = self.initResourceLocations(),
        diceMap = self.diceMap = self.initResourceValues(resourceMap),
        boardData = {
            resourceMap: resourceMap,
            diceMap: diceMap,
            playerMap: players.getSerializablePlayerMap()
        };

    self.broadcast('setup', boardData);
    self.firstRoll()
        .then(self.setup.bind(self))
        .then(function () {
            players.reset();
            self.nextTurn();
        });
};

/**
 * determine which player is going first.
 */
Board.prototype.firstRoll = function () {
    var self = this,
        players = this.players,
        playerCount = players.count(),
        deferred = Q.defer(),
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
                    players.next();
                    rollHelper();
                } else {
                    players.setStartPlayer(id);
                    deferred.resolve();
                }
            });
    }

    rollHelper();
    return deferred.promise;
};

Board.prototype.setup = function () {
    var players = this.players,
        self = this,
        resourceMap = self.resourceMap,
        playerCount = players.count(),
        deferred = Q.defer(),
        count = 0;

    function setupHelper() {
        var player = players.getCurrent();
        self.chooseSettlement(player)
        .then(function (data) {
            var intersectionId = data.intersectionId,
                tileIds,
                resource,
                i;
            if (count >= playerCount) {
                tileIds = utils.getTileIdsFromIntersectionId(intersectionId);
                for (i = 0; i < tileIds.length; i++) {
                    resource = resourceMap[tileIds[i]].type;
                    if (resource !== 'desert')
                        player.resources[resource]++;
                }
                self.updateResources(player);
            }
            return data;
        })
        .then(function (data) {
            return self.chooseRoad(data.player, data.intersectionId);
        })
        .then(function () {
            if (++count < 2 * playerCount) {
                if (count < playerCount) {
                    players.next();
                } else if (count > playerCount) {
                    // give player resources.
                    players.previous();
                }
                setupHelper();
            } else {
                deferred.resolve();
            }
        });
    }

    setupHelper();
    return deferred.promise;
};

Board.prototype.roll = function (player) {
    // return a promise. when we receive client response, resolve promise
    var self = this,
        rollDice = self.rollDice,
        deferred = Q.defer();
    player.socket.emit('roll');
    player.socket.once('roll', function () {
        var diceValue = rollDice();
        self.notify(player.name + ' rolled ' + diceValue);
        deferred.resolve(diceValue, player.id);
    });

    return deferred.promise;
};

Board.prototype.chooseSettlement = function (player) {
    // return a promise. when we receive client response, resolve promise
    var self = this,
        deferred = Q.defer();
    player.socket.emit('settlement');
    player.socket.once('settlement', function (intersectionId) {
        self.placeSettlement(player, intersectionId);
        deferred.resolve({player: player, intersectionId: intersectionId});
    });

    return deferred.promise;
};

Board.prototype.chooseCity = function (player) {
};

Board.prototype.chooseRoad = function (player, intersectionId) {
    var self = this,
        deferred = Q.defer();
    player.socket.emit('road', intersectionId);
    player.socket.once('road', function (edge) {
        self.placeRoad(player, edge);
        deferred.resolve({player: player, edge: edge});
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
        resource = self.resourceMap[tileId].type,
        settlements = self.settlements,
        players = self.players,
        updateQueue = [],
        i;
    tileId = +tileId;

    settlements.each(function (settlement) {
        var intersection = utils.getTileIdsFromIntersectionId(settlement.intersectionId);
        if (intersection.indexOf(tileId) >= 0) {
            var player = players.getPlayer(settlement.playerId);
            player.resources[resource] += settlement.type === 'city' ? 2 : 1;
            if (updateQueue.indexOf(player.id) < 0) {
                updateQueue.push(player.id);
            }
        }
    });
    for (i = 0; i < updateQueue.length; i++) {
        self.updateResources(players.getPlayer(updateQueue[i]));
    }
};

Board.prototype.updateResources = function (player) {
    player.socket.emit('updateresources', player.resources);
};

/**
 * main game loop.
 */
Board.prototype.nextTurn = function () {
    var self = this,
        players = self.players,
        player = players.getCurrent(),
        socket = player.socket;

    self.roll(player)
        .then(function (diceValue) {
            // distribute resources
            if (diceValue !== 7) {
                var tileIds = self.diceMap[diceValue],
                    i;
                for (i = 0; i < tileIds.length; i++) {
                    self.distributeResources(tileIds[i]);
                }
            } else {
                // TODO handle rolling 7
            }
            self.startTurn(player);
            socket.emit('start');
            socket.once('end', function () {
                players.next();
                self.endTurn(player);
                self.nextTurn();
            });
        });
};

Board.prototype.startTurn = function (player) {
    var self = this,
        socket = player.socket;
    // init build channels.
    socket.on('road', function (edge) {
        self.buildRoad(player, edge);
    });
    socket.on('settlement', function (intersectionId) {
        // validate intersection -> pay -> place settlement
        if (self.isValidSettlement(player.id, intersectionId)) {
            console.log('Settlement is valid');
            self.buildSettlement(player, intersectionId);
        } else {
            socket.emit('error', 'invalid settlement location');
        }
    });
};

Board.prototype.endTurn = function (player) {
    var socket = player.socket;
    socket.removeAllListeners('settlement');
};

Board.prototype.pay = function (player, price) {
    var resources = player.resources,
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
        this.placeSettlement(player, intersectionId);
    } else {
        // throw error.
    }
};

Board.prototype.buildCity = function (player, intersectionId) {
    var cost = {
        wheat: 2,
        stone: 3
    };
    if (this.pay(player, cost)) {
        this.placeCity(player, intersectionId);
    } else {
        // throw error.
    }
};

Board.prototype.buildRoad = function (player, edge) {
    var cost = {
        brick: 1,
        wood: 1
    };
    if (this.pay(player, cost)) {
        this.placeRoad(player, edge);
    }
};

Board.prototype.buildDevCard = function () {
    var cost = {
        sheep: 1,
        stone: 1,
        wheat: 1
    };
    if (this.pay(player, cost)) {
        //this.drawDevCard(player);
    }
};

Board.prototype.placeSettlement = function (player, intersectionId) {
    var settlement = {
        intersectionId: intersectionId,
        playerId: player.id
    };
    this.settlements.add(settlement);
    this.broadcast('update', {type: 'settlement', settlement: settlement});
    return settlement;
};

Board.prototype.placeRoad = function (player, edge) {
    var road = {
        edge: edge,
        playerId: player.id
    };
    this.roads.add(road);
    this.broadcast('update', {type: 'road', road: road});
    return road;
};

Board.prototype.placeCity = function (playerId, cityLocation) {
    // Check to see if this is a valid location

    // check to see if location is legal
    //     - player must have an existing settlement at location.
};

/**
 * placement methods must trigger propagate event.
 */
Board.prototype.isValidSettlement = function (playerId, intersectionId) {
    // Check to see if this is a valid settlement location.
    var self = this,
        intersections = components.intersections,
        settlements = self.settlements,
        roads = self.roads.byPlayerId(playerId),
        intersection = utils.getTileIdsFromIntersectionId(intersectionId),
        isLegal;
    if (intersections.indexOf(intersectionId) < 0) {
        return;
    }
    
    // check to see if location is legal
    //     - location is not occupied
    //     - at least 2 roads  away from any other settlement.
    isLegal = settlements.every(function (settlement) {
        var otherIntersection = utils.getTileIdsFromIntersectionId(settlement.intersectionId),
            count = 0;
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
    if (settlements.byPlayerId(playerId).length < 2) {
        // if we're in the setup phase, don't have the requirement that settlement
        // must touch road.
        return true;
    }
    //     - player has a road that is connected
    isLegal = roads.some(function (road) {
        var edge = road.edge;
        if (edge[0] === intersectionId || edge[1] === intersectionId) {
            return true;
        }
    });
    if (!isLegal) {
        return;
    }
    return true;
};

Board.prototype.isValidRoad = function (playerId, edge) {
    var intersections = components.intersections,
        roads = this.roads,
        // Check to see if start and end are valid intersections.
        startId = edge[0],
        endId = edge[1],
        startIntersection = utils.getTileIdsFromIntersectionId(startId),
        endIntersection = utils.getTileIdsFromIntersectionId(endId),
        isLegal;

    if (intersections.indexOf(startId) < 0 || intersections(endId) < 0) {
        return;
    }
    // Make sure start and end positions are one edge length apart.
    var count = 2;
    startIntersection.forEach(function (tileId) {
        if (endIntersection.indexOf(tileId) >= 0) {
            count--;
        }
    });
    if (count) { return; }

    //     - not already an existing road here.
    isLegal = roads.every(function (road) {
        var otherEdge = road.edge,
            intersectionId = otherEdge[0];
        if (startId === intersectionId || endId === intersectionId) {
            intersectionId = otherEdge[1];
            if (startId === intersectionId || endId === intersectionId) {
                return false;
            }
        }
        return true;
    });
    if (!isLegal) { return; }

    // check to see if location is legal
    //     - connecting to another road / settlement
    roads = roads.byPlayerId(playerId);
    if (roads.length >= 2) {
        isLegal = roads.some(function (road) {
            var otherEdge = road.edge,
                intersectionId = otherEdge[0];
            if (intersectionId === startId || intersectionId === endId) {
                return true;
            }
            intersectionId = otherEdge[1];
            if (intersectionId === startId || intersectionId === endId) {
                return true;
            }
        });
        if (!isLegal) { return; }
    }
    return true;
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
