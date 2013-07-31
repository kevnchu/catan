var EventEmitter = require('events').EventEmitter;

var Players = require('./players').Players,
    Player = require('./player').Player,
    Settlement = require('./settlement'),
    Road = require('./road'),
    DevelopmentCards = require('./development_cards'),
    // TODO rename to avoid confusion w/ stdlib util.
    utils = require('../utils');

exports.Board = Board;

function Board() {
    this.sea_locations = {
      stone: [-29,-30],
      wheat: [-25,-26],
      mystery: [-23,-22,-12,-13,-9,-10,-2,-3],
      wood: [-20,-19],
      brick: [-15,-16],
      sheep: [-5,-6]
    };
    var locations = [[0,1,12], [0,11,12], [0,11,-1], [0,-2], [0,-3],
      [0,1,-4], [1,12,13], [1,13,2], [1,-5], [1,-6,2],
      [2,3,13], [2,-7], [2,-8], [2,3,-9], [3,13,14],
      [3,14,4], [3,-10], [3,-11,4], [4,14,5], [4,5,-14],
      [4,-12], [4,-13], [5,14,15], [5,6,15], [5,6,-16],
      [5,-15], [6,7,15], [6,7,-19], [6,-17], [6,-18],
      [7,15,16], [7,8,16], [7,8,-21], [7,-20], [8,-22],
      [8,-23], [8,-24,9], [8,9,16], [9,-25], [9,-26,10],
      [9,10,17], [9,17,16], [10,-27], [10,-28], [10,-29,11],
      [10,11,17], [11,-30], [11,12,17], [12,17,18], [16,17,18],
      [15,16,18], [14,15,18], [13,14,18], [12,13,18]];
    
    this.locations = {};

    locations.forEach(function (location) {
        this.locations[utils.getLocationId(location)] = location;
    }, this);
        
    this.resourceMap = {};
    this.initResourceLocations();

    this.diceMap = {};
    this.initResourceValues();
    
    this.settlements = [];
    this.roads = [];

    //this.dev_cards = DevelopmentCards.new

    // XXX setting up mock players
    this.players = new Players();
    //p1 = Player.new 'p1'
    //var p1 = new Player('p1');

//    for (var resource in p1.resources) {
//        p1.resources[resource] += 6;
//    }
//    p1.resources.forEach(function (resource) {
//        p1.resources[resource] += 6;
//    });
//    this.players.newPlayer(p1);
}

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

Board.prototype.addUser = function (data) {
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

Board.prototype.firstRoll = function () {
    var max = 0,
        id,
        diceValue,
        players = this.players,
        rollDice = this.rollDice;
    forEachPlayer.call(this, function (player, messager) {
        player.socket.emit('roll');
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

//Board.prototype.setupYO = function () {
//    // Let each player pick initial settlements.
//    var self = this;
//    forEachPlayer.call(this, function (player, messager) {
//        // get settlement location...
//        player.socket.emit('chooselocation');
//        player.socket.once('chooselocation', function (settlementLocation) {
//            self.placeSettlement(player, settlementLocation);
//            // get road location.
//            player.socket.emit('chooselocation');
//            player.socket.once('chooselocation', function (roadLocation) {
//                self.placeRoad(player, settlementLocation, roadLocation);
//                messager.emit('next');
//            });
//        });
//    }, function () {
//        // Do in reverse order
//        forEachPlayer.call(self, function (player, messager) {
//            // get settlement location...
//            // get road location.
//            player.socket.emit('chooselocation');
//            player.socket.once('chooselocation', function (settlementLocation) {
//                self.placeSettlement(player, settlementLocation);
//                player.socket.emit('chooselocation');
//                // distribute resources for second location.
//                self.distributeResources(player, settlementLocation);
//                player.socket.once('chooselocation', function (roadLocation) {
//                    self.placeRoad(player, settlementLocation, roadLocation);
//                    messager.emit('next');
//                });
//            });
//        }, self.start, true);
//    });
//};

Board.prototype.setup = function () {
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

Board.prototype.chooseSettlement = function (player, callback) {
    var self = this;
    player.socket.emit('chooselocation');
    player.socket.once('chooselocation', function (settlementLocation) {
        self.placeSettlement(player, settlementLocation);
        callback.call(this, settlementLocation);
    });
};

Board.prototype.chooseCity = function (player, callback) {
};

Board.prototype.chooseRoad = function (player, start, callback) {
    var self = this;
    player.socket.emit('chooselocation');
    player.socket.once('chooselocation', function (roadLocation) {
        self.placeRoad(player, start, roadLocation);
        callback.call(this, start, roadLocation);
    });
};

Board.prototype.distributeResources = function (player, location, isCity) {
    var self = this;
    location.forEach(function (id) {
        var resource = self.resourceMap[id];
        player.resources[resource] += isCity ? 2 : 1;
    });
};

Board.prototype.start = function () {
    console.log("Setup complete. Game starting");
};

/**
 * placement methods must trigger propagate event.
 */
Board.prototype.placeSettlement = function (player, settlementLocation) {
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
    });
    if (!isLegal) {
        return;
    }
    return true;
    // create new settlent and add to data structure.
};

Board.prototype.placeRoad = function (player, start, end) {
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
    // TODO test this.
    var resourceMap = this.resourceMap,
        temp = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18],
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
};

Board.prototype.initResourceValues = function () {
    // TODO test this.
    var resourceLocations = [],
        resourceMap = this.resourceMap,
        diceMap = this.diceMap,
        location,
        resource,
        robber,
        i;
    for (location in resourceMap) {
        if (resourceMap.hasOwnProperty(location)) {
            if (resourceMap[location]) {
                resourceLocations.push(location);
            } else {
                robber = location;
            }
        }
    }
    for (i = 2; i <= 12; i++) {
        if (i === 2 || i === 12) {
            diceMap[i] = resourceLocations.pop();
        } else if (i === 7) {
            diceMap[i] = [robber];
        } else {
            diceMap[i] = [resourceLocations.pop(), resourceLocations.pop()];
        }
    }
};

Board.prototype.rollDice = function () {
    return Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6) + 2;
};

