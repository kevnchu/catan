module.exports = Board;

var components = require('./components'),
    Settlements = require('./settlements'),
    Roads = require('./roads'),
    utils = require('./utils');

function Board(boardData) {
    this.settlements = new Settlements();
    this.roads = new Roads();
    this.resourceMap = boardData.resourceMap;
    this.diceMap = boardData.diceMap;
    this.tileDiceValueMap = boardData.tileDiceValueMap;
    this.playerMap = boardData.playerMap;
}

Board.prototype.getValidIntersections = function (playerId) {
    var self = this,
        intersections = Object.keys(components.intersectionMap);
    return _.filter(intersections, function (intersectionId) {
        return self.isValidSettlement(playerId, intersectionId);
    });
};

Board.prototype.longestRoad = function () {
};

Board.prototype.isValidSettlement = function (playerId, intersectionId) {
    // Check to see if this is a valid settlement location.
    var self = this,
        intersectionMap = components.intersectionMap,
        settlements = self.settlements,
        roads = self.roads.byPlayerId(playerId),
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
        console.log('Settlement must be at least 2 roads away from another settlement.');
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
        console.log('Settlement is not connected to a road.');
        return;
    }
    return true;
};

Board.prototype.addSettlement = function (settlement) {
    this.settlements.add(settlement);
};

Board.prototype.addRoad = function (road) {
    this.roads.add(road);
};

Board.prototype.addCity = function (city) {
    var settlement = this.settlements.byIntersectionId(city.intersectionId);
    settlement.type = 'city';
};

Board.prototype.isValidRoad = function (player, start, end) {
    /*
    var intersections = components.intersectionMap,
        roads = this.roads,
        // Check to see if start and end are valid intersections.
        startId = utils.getIntersectionId(start),
        endId = utils.getIntersectionId(end);
    if (!intersections[startId] || !intersections[endId]) {
        return;
    }
    // Make sure start and end positions are one edge length apart.
    var count = 2;
    start.forEach(function (tileId) {
        if (end.indexOf(tileId) >= 0) {
            count--;
        }
    });
    if (count) { return; }

    //     - not already an existing road here.
    isLegal = roads.each(function (road) {
        var edge = road.get('edge'),
            intersectionId = utils.getIntersectionId(edge[0]);
        if (startId === intersectionId || endId === intersectionId) {
            intersectionId = utils.getIntersectionId(edge[1]);
            if (startId === intersectionId || endId === intersectionId) {
                return false;
            }
        }
        return true;
    });
    if (!isLegal) { return; }

    if (roads.byPlayerId(player.id).length < 3) {
        return true;
    }

    // check to see if location is legal
    //     - connecting to another road / settlement
    var isLegal = roads.byPlayerId(player.id).some(function (road) {
        var edge = road.get('edge'),
            intersectionId = utils.getIntersectionId(edge[0]);
        if (intersectionId === startId || intersectionId === endId) {
            return true;
        }
        intersectionId = utils.getIntersectionId(edge[1]);
        if (intersectionId === startId || intersectionId === endId) {
            return true;
        }
    });
    if (!isLegal) { return; }
    return true;
   */
};

Board.prototype.placeRoad = function (road) {
    this.roads.add(road);
};

Board.prototype.isValidCity = function (player, intersectionId) {
    // check that the player has an existing settlement in the given intersection.
    /*
    var settlements = this.settlements.get(player.playerId);
    return settlements.some(function (settlement) {
        return settlement.intersectionId === intersectionId &&
            settlement.type !== 'city';
    });
    */
};

Board.prototype.placeCity = function (settlement) {
    settlement.type = 'city';
};

Board.prototype.moveRobber = function (tileId) {
    this.robber = tileId;
};

Board.prototype.getTileIdsByDiceValue = function (diceValue) {
    return this.diceMap[diceValue];
};

Board.prototype.getResourceTypeByTileId = function (tileId) {
    return this.resourceMap[tileId];
};

Board.prototype.getSettlementsAdjToTileId = function (tileId) {
    return this.settlements.filter(function (settlement) {
        return settlement.isAdjacentTo(tileId);
    });
};

Board.prototype.getSettlementAtLocation = function (loc) {
};
