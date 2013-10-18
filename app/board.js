module.exports = Board;

var Q = require('q'),
    Players = require('./players'),
    Settlements = require('./settlements'),
    Roads = require('./roads'),
    DevelopmentCards = require('./development_cards'),
    utils = require('./utils'),
    components = require('./components');

function Board(id) {
    this.id = id;
    this.settlements = new Settlements();
    this.roads = new Roads();
    this.players = new Players();
    this.devCards = new DevelopmentCards();
    this.longestRoad = {
        len: 4
    };
    this.readyCount = 0;
    this.isStarted = false;
}

Board.prototype.addUser = function (player) {
    var self = this,
        players = self.players;
    players.addPlayer(player);
    self.notify(player.name + ' joined the game');
    player.socket.once('ready', function () {
        var playerCount = players.count();
        self.readyCount++;
        if (self.readyCount === playerCount && playerCount > 2) {
            self.isStarted = true;
            self.initialize();
        }
    });
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
    var self = this,
        players = self.players,
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

Board.prototype.updateDevCards = function (player) {
    player.socket.emit('updatedevcards', player.devCards);
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
                self.moveRobber(player)
                    .then(function (tileId) {
                        // steal resource from player who has a settlement
                        // adjacent to tileId
                    });
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
        socket = player.socket,
        handlers = {
            road: function (edge) {
                self.buildRoad(player, edge);
            },
            settlement: function (intersectionId) {
                self.buildSettlement(player, intersectionId);
            },
            devcard: function () {
                self.buildDevCard(player);
            },
            playdevcard: function () {
                self.playDevCard(player);
                socket.removeAllListeners('playdevcard');
            }
        },
        channel;

    for (channel in handlers) {
        if (handlers.hasOwnProperty(channel)) {
            socket.on(channel, handlers[channel]);
        }
    }
};

Board.prototype.endTurn = function (player) {
    var socket = player.socket;
    socket.removeAllListeners('road');
    socket.removeAllListeners('settlement');
    socket.removeAllListeners('devcard');
    socket.removeAllListeners('playdevcard');
};

Board.prototype.canPay = function (player, price) {
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
    return true;
};

Board.prototype.pay = function (player, price) {
    var resources = player.resources,
        resource,
        quantity;
    for (resource in price) {
        if (price.hasOwnProperty(resource)) {
            quantity = price[resource];
            resources[resource] -= quantity;
        }
    }
    this.updateResources(player);
};

Board.prototype.buildSettlement = function (player, intersectionId) {
    var cost = components.buildingCosts.settlement;
    if (this.canPay(player, cost) && this.isValidSettlement(player.id, intersectionId)) {
        this.pay(player, cost);
        this.placeSettlement(player, intersectionId);
        return true;
    }
};

Board.prototype.buildCity = function (player, intersectionId) {
    var cost = components.buildingCosts.city;
    if (this.canPay(player, cost) && this.isValidCity(player.id, intersectionId)) {
        this.pay(player, cost);
        this.placeCity(player, intersectionId);
        return true;
    }
};

Board.prototype.buildRoad = function (player, edge) {
    var cost = components.buildingCosts.road;
    if (this.canPay(player, cost) && this.isValidRoad(player.id, edge)) {
        this.pay(player, cost);
        this.placeRoad(player, edge);
        return true;
    }
};

Board.prototype.buildDevCard = function (player) {
    var cost = components.buildingCosts.devCard;
    if (this.canPay(player, cost)) {
        this.pay(player, cost);
        this.drawCard(player);
        return true;
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
        },
        roads = this.roads,
        longestRoad = this.longestRoad,
        len;
    roads.add(road);
    this.broadcast('update', {type: 'road', road: road});
    len = roads.longestPath(player.id);
    if (len > longestRoad.len) {
        longestRoad.playerId = player.id;
        longestRoad.len = len;
        // FIXME broadcast to clients
    }
    return road;
};

Board.prototype.placeCity = function (playerId, intersectionId) {
    var settlement = this.settlements.byIntersectionId(intersectionId);
    settlement.type = 'city';
    this.broadcast('update', {type: 'city', city: settlement});
    return settlement;
};

Board.prototype.drawCard = function (player) {
    var card = this.devCards.draw();
    player.devCards.push(card);
    this.updateDevCards(player);
};

Board.prototype.playDevCard = function (player, card, data) {
    var self = this,
        cardTable = {
            victory_point: self.victoryPointCard,
            knight: self.knightCard
        };
    cardTable[card](player, data);
};

Board.prototype.victoryPointCard = function (player) {
    player.points += 1;
};

Board.prototype.knightCard = function (player, tileId) {
    this.robber = tileId;
};

Board.prototype.monopolyCard = function (player, resourceType) {
};

Board.prototype.roadBuildingCard = function (player) {
};

Board.prototype.yearOfPlentyCard = function (player, resourceType) {
};

/**
 * returns true if player is done with initial setup.
 * @param {string} playerId
 */
Board.prototype.isSetupComplete = function (playerId) {
    // to see if player has completed setup, check to see they have placed
    // at least 2 roads.
    return this.roads.byPlayerId(playerId).length >= 2;
};

Board.prototype.hasConnectedRoad = function (playerId, intersectionId) {
    var roads = this.roads.byPlayerId(playerId);
    return roads.some(function (road) {
        var edge = road.edge;
        if (edge[0] === intersectionId || edge[1] === intersectionId) {
            return true;
        }
    });
};

Board.prototype.isIntersection = function (intersectionId) {
    var intersections = components.intersections;
    return intersections.indexOf(intersectionId) >= 0;
};

/**
 * returns true if there is not a settlement on the given intersection and
 * there are no settlements < 2 roads away.
 * @param {string} intersectionId
 */
Board.prototype.isIntersectionOccupied = function (intersectionId) {
    var settlements = this.settlements,
        intersection = utils.getTileIdsFromIntersectionId(intersectionId);
    return settlements.some(function (settlement) {
        var otherIntersection = utils.getTileIdsFromIntersectionId(settlement.intersectionId),
            count = 0;
        otherIntersection.forEach(function (point) {
            if (intersection.indexOf(point) >= 0) {
                count++;
            }
        });
        return count >= 2;
    });
};

/**
 * checks to see if player can build a settlement at given intersection
 * @param {string} playerId
 * @param {string} intersectionId
 */
Board.prototype.isValidSettlement = function (playerId, intersectionId) {
    var self = this;
    return self.isIntersection(intersectionId) &&
        !self.isIntersectionOccupied(intersectionId) &&
        (self.isSetupComplete(playerId) ?
            self.hasConnectedRoad(playerId, intersectionId) : true);
};

Board.prototype.isEdge = function (edge) {
    // Make sure start and end positions are one edge length apart.
    if (!this.isIntersection(edge[0]) || !this.isIntersection(edge[1])) {
        return false;
    }
    var count = 2,
        startIntersection = utils.getTileIdsFromIntersectionId(edge[0]),
        endIntersection = utils.getTileIdsFromIntersectionId(edge[1]);
    startIntersection.forEach(function (tileId) {
        if (endIntersection.indexOf(tileId) >= 0) {
            count--;
        }
    });
    return !count;
};

Board.prototype.isEdgeOccupied = function (edge) {
    var roads = this.roads,
        startId = edge[0],
        endId = edge[1];
        
    return roads.some(function (road) {
        var otherEdge = road.edge,
            intersectionId = otherEdge[0];
        if (startId === intersectionId || endId === intersectionId) {
            intersectionId = otherEdge[1];
            if (startId === intersectionId || endId === intersectionId) {
                return true;
            }
        }
    });
};

/**
 * check to see if player can build a road on the given edge.
 * @param {string} playerId
 * @param {array} edge
 */
Board.prototype.isValidRoad = function (playerId, edge) {
    var self = this;
    return self.isEdge(edge) &&
        !self.isEdgeOccupied(edge) &&
        (self.isSetupComplete(playerId) ?
            self.hasConnectedRoad(playerId, edge[0]) || self.hasConnectedRoad(playerId, edge[1]) :
            true);
};

/**
 * check to see if player can build a city on given intersection
 * @param {string} playerId
 * @param {string} intersectionId
 */
Board.prototype.isValidCity = function (playerId, intersectionId) {
    var settlements = this.settlements.byPlayerId(playerId);
    return settlements.some(function (settlement) {
        return settlement.intersectionId === intersectionId &&
            settlement.type !== 'city';
    });
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
        diceValues = [2,3,3,4,4,5,5,6,6,8,8,9,9,10,10,11,11,12],
        diceValue,
        locationId;
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

/**
 * prompt player to choose robber location
 * @param {object} player
 */
Board.prototype.moveRobber = function (player) {
    // return a promise. when we receive client response, resolve promise
    var self = this,
        deferred = Q.defer();
    player.socket.emit('moverobber');
    player.socket.once('moverobber', function (tileId) {
        tileId = +tileId;
        if (tileId >= 0 && tileId <= 18) {
            self.robber = tileId;
            deferred.resolve(tileId);
        } else {
            deferred.reject(new Error('Invalid robber location'));
        }
    });
    return deferred.promise;
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
