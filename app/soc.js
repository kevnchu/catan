var EventEmitter = require('events').EventEmitter,
    inherits = require('util').inherits;

var Players = require('./players').Players,
    Player = require('./player').Player,
    Settlement = require('./settlement'),
    Road = require('./road'),
    DevelopmentCards = require('./development_cards'),
    // TODO rename to avoid confusion w/ stdlib util.
    utils = require('./utils'),
    Board = require('./board.js');

function Soc() {
    this.board = new Board();
    var resourceMap = this.generateResourceLocations();
    var diceMap = this.generateResourceValues(resourceMap);
    this.board.setup(resourceMap, diceMap);
    this.players = new Players();
}

inherits(Soc, EventEmitter);

/**
 *
 * the problem is that inner gets called immediately
 * after fn invocation instead of after the client
 * responds.
 * What we really want is.
 * each(fn, complete) ->
 *     invoke fn for the first player.
 *     when player has responded
 *     call players.next
 *     repeat until every player has responded.
 *     call complete.
 *
 */
function forEachPlayer(fn, complete, reverse) {
    var players = this.players,
        playerCount = players.count(),
        count = 0,
        messager = new EventEmitter();
    
    // Always start at the first player.
    players.reset();
    if (reverse) {
        players.previous();
    }
    function inner() {
        var player = players.getCurrent();
        console.log(player.id + ' listening to next event');
        messager.once('next', function () {
            if (++count < playerCount) {
                // Move to the next player
                if (reverse) {
                    players.previous();
                } else {
                    players.next();
                }
                inner();
            } else {
                // we've executed fn for each player
                if (complete) {
                    complete();
                }
            }
        });
        fn(player, messager);
    }
    if (count < playerCount) {
        inner();
    }
}

Soc.prototype.addUser = function (data) {
    var player = new Player(data.name, data.socket),
        players = this.players;
    players.newPlayer(player);
    console.log("player count: " + players.count());
    // XXX temp for testing only using 2 players.
    if (players.count() > 1) {
        console.log('Starting game.');
        this.firstRoll();
    }
};

Soc.prototype.removeUser = function (data) {
    //TODO
};

Soc.prototype.firstRoll = function () {
    var max = 0,
        id,
        diceValue,
        players = this.players,
        rollDice = this.rollDice;
    forEachPlayer.call(this, function (player, messager) {
        player.socket.emit('action', 'roll');
        player.socket.once('roll', function () {
            diceValue = rollDice();
            if (diceValue > max) {
                max = diceValue;
                id = player.id;
            }
            messager.emit('next');
        });
    }, (function () {
        // Finally.
        console.log(id + ' goes first.');
        players.setCurrent(id);
        // start setup
        this.setup();
    }).bind(this));
};

Soc.prototype.setup = function () {
    var self = this;
    forEachPlayer.call(this, function (player, messager) {
        self.chooseSettlement(player, function (location) {
            self.chooseRoad(player, location, function () {
                messager.emit('next');
            });
        });
    }, function () {
        forEachPlayer.call(self, function (player, messager) {
            self.chooseSettlement(player, function (location) {
                self.distributeResources(player, location);
                self.chooseRoad(player, location, function () {
                    messager.emit('next');
                });
            });
        }, self.start, true);
    });
};

Soc.prototype.chooseSettlement = function (player, callback) {
    var self = this;
    player.socket.emit('chooselocation');
    player.socket.once('chooselocation', function (settlementLocation) {
        self.placeSettlement(player, settlementLocation);
        callback.call(this, settlementLocation);
    });
};

Soc.prototype.chooseCity = function (player, callback) {
};

// TODO currently depends on already having a starting position
// selected.
Soc.prototype.chooseRoad = function (player, start, callback) {
    var self = this;
    player.socket.emit('chooselocation');
    player.socket.once('chooselocation', function (roadLocation) {
        self.placeRoad(player, start, roadLocation);
        callback.call(this, start, roadLocation);
    });
};

Soc.prototype.distributeResources = function (player, intersection, isCity) {
    intersection.forEach(function (id) {
        var resource = this.board.getResourceTypeByTileId(id);
        player.resources[resource] += isCity ? 2 : 1;
    });
};

Soc.prototype.start = function () {
    console.log("Setup complete. Game starting");
    this.players.reset();
    this.nextPlayer();
};

function trade (data) {
    // TODO
}

function build (data) {
    var buildMap = {
        settlement: this.buildSettlement,
        road: this.buildRoad,
        city: this.buildCity,
        devCard: this.buildDevCard
    };
    buildMap[data.type](data);
}

function devcard (data) {
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

// XXX this could be moved to player class. eg. player.startTurn/endTurn
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

Soc.prototype.nextPlayer = function () {
    var self = this;
    var players = this.players;
    var player = players.getCurrent();
    var socket = player.socket;
    this.addListeners(socket);
    socket.emit('action', { path: 'helpers/action.html' });
    socket.once('endturn', function () {
        players.next();
        self.removeListeners(socket);
        self.nextPlayer();
    });
};

Soc.prototype.pay = function (player, price) {
    // TODO
    var resources = player.resources,
        resource,
        quantity;
    for (resource in price) {
        if (price.hasOwnProperty(resource)) {
            quantity = price[resource];
            if (resources[resource] < quantity) {
                return false;
            }
        }
    }
    for (resource in price) {
        if (price.hasOwnProperty(resource)) {
            quantity = price[resource];
            resources[resource] -= quantity;
        }
    }
    return true;
};

Soc.prototype.buildSettlement = function (player, intersection) {
    var cost = {
        brick: 1,
        wood: 1,
        wheat: 1,
        sheep: 1
    };
    if (this.pay(player, cost)) {
        this.placeSettlement(player, intersection);
    }
};

Soc.prototype.buildCity = function (player, intersection) {
    var cost = {
        wheat: 2,
        stone: 3
    };
    if (this.pay(player, cost)) {
        this.placeCity(player, intersection);
    }
};

Soc.prototype.buildRoad = function (player, start, end) {
    var cost = {
        brick: 1,
        wood: 1
    };
    if (this.pay(player, cost)) {
        this.placeRoad(player, start, end);
    }
};

Soc.prototype.buildDevCard = function (player) {
    var cost = {
        sheep: 1,
        stone: 1,
        wheat: 1
    };
    if (this.pay(player, cost)) {
        this.drawDevCard(player);
    }
};

/**
 * placement methods must trigger propagate event.
 */
Soc.prototype.placeSettlement = function (player, settlementLocation) {
    // Check to see if this is a valid settlement location.
    var locations = this.locations;
    var settlements = this.settlements;
    var settlementLocationId = utils.getLocationId(settlementLocation);
    if (!locations[settlementLocationId]) {
        return;
    }
    
    // check to see if location is legal
    //     - location is not occupied
    //     - at least 2 roads  away from any other settlement.
    var isLegal = settlements.every(function (settlement) {
        var location = settlement.location;
        var count = 0;
        location.forEach(function (point) {
            if (settlementLocation.indexOf(point) >= 0) {
                count++;
            }
        });
        return count < 2;
    });
    if (!isLegal) {
        return;
    }
    //     - player has a road that is connected
    isLegal = player.roads.some(function (road) {
        var locationId = utils.getLocationId(road.edge[0]);
        if (locationId === settlementLocationId) {
            return true;
        }
        locationId = utils.getLocationId(road.edge[1]);
        if (locationId === settlementLocationId) {
            return true;
        }
    });
    if (!isLegal) {
        return;
    }
    // create new settlent and add to data structure.
    var settlement = new Settlement(settlementLocation, player.id);
    this.board.placeSettlement(settlement);
};

Soc.prototype.placeRoad = function (player, start, end) {
    // Validate that the start and end locations are valid

    // check to see if location is legal
    //     - connecting to another road / settlement
    //     - not already an existing road here.
};

Soc.prototype.placeCity = function (player, cityLocation) {
    // Check to see if this is a valid location

    // check to see if location is legal
    //     - player must have an existing settlement at location.
};

Soc.prototype.transitionState = function () {
};

Soc.prototype.generateResourceLocations = function () {
    // TODO test this.
    var resourceMap = {},
        temp = [0,1,2,3,4,5,6,
            7,8,9,10,11,12,
            13,14,15,16,17,18],
        locations = [],
        i,
        resource;
    while (temp.length) {
        locations.push(temp.splice(Math.floor(Math.random() * temp.length), 1)[0]);
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
        resourceMap[locations[i]] = resource;
    }
    resourceMap[locations[18]] = null;
    return resourceMap;
};

Soc.prototype.generateResourceValues = function (resourceMap) {
    // TODO test this.
    var resourceLocations = [],
        diceMap = {},
        diceValues = [2,3,3,4,4,5,5,6,6,8,8,9,9,10,10,11,11,12],
        diceValue,
        locationId,
        resource,
        robber,
        i;
    diceValues = utils.shuffleArray(diceValues);
    for (locationId in resourceMap) {
        if (resourceMap.hasOwnProperty(locationId)) {
            if (resourceMap[locationId]) {
                diceValue = diceValues.pop();
                if (!diceMap[diceValue]) {
                    diceMap[diceValue] = [];
                }
                diceMap[diceValue].push(locationId);
            } else {
                diceMap[7] = locationId;
            }
        }
    }
    return diceMap;
};

Soc.prototype.rollDice = function () {
    return Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6) + 2;
};

