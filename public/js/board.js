module.exports = Board;

var components = require('./components'),
    Settlements = require('./settlements'),
    Roads = require('./roads'),
    utils = require('./utils');

/**
 * 
 * @param {object} boardData
 */
function Board(boardData) {
    this.settlements = new Settlements();
    this.roads = new Roads();
    this.resourceMap = boardData.resourceMap;
    this.diceMap = boardData.diceMap;
    this.tileDiceValueMap = boardData.tileDiceValueMap;
    this.playerMap = boardData.playerMap;
}

/**
 * @param {string} playerId
 */
Board.prototype.getValidIntersections = function (playerId) {
    var self = this,
        intersections = components.intersections;
    return _.filter(intersections, function (intersectionId) {
        return self.isValidSettlement(playerId, intersectionId);
    });
};

/**
 * @param {string} playerId
 * @param {string} [intersectionId]
 */
Board.prototype.getValidEdges = function (playerId, intersectionId) {
    var self = this,
        edges = components.edges;

    if (intersectionId) {
        edges = _.filter(edges, function (edge) {
            return edge[0] === intersectionId || edge[1] === intersectionId;
        });
    }
    return _.filter(edges, function (edge) {
        return self.isValidRoad(playerId, edge);
    });
};

/**
 * 
 * @param {object} settlement
 */
Board.prototype.addSettlement = function (settlement) {
    this.settlements.add(settlement);
};

/**
 * 
 * @param {object} road
 */
Board.prototype.addRoad = function (road) {
    this.roads.add(road);
};

/**
 * 
 * @param {object} city
 */
Board.prototype.addCity = function (city) {
    var settlement = this.settlements.byIntersectionId(city.intersectionId);
    settlement.type = 'city';
};

/**
 * 
 * @param {string} playerId
 * @param {string} intersectionId
 */
Board.prototype.isValidSettlement = function (playerId, intersectionId) {
    // Check to see if this is a valid settlement location.
    var self = this,
        intersections = components.intersections,
        settlements = self.settlements,
        roads = self.roads.byPlayerId(playerId),
        intersection = utils.getTileIdsFromIntersectionId(intersectionId);
    if (intersections.indexOf(intersectionId) < 0) {
        return;
    }
    
    // check to see if location is legal
    //     - location is not occupied
    //     - at least 2 roads  away from any other settlement.
    var isLegal = settlements.every(function (settlement) {
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
        console.log('Settlement must be at least 2 roads away from another settlement.');
        return;
    }
    if (settlements.byPlayerId(playerId).length < 2) {
        // if we're in the setup phase, don't have the requirement that settlement
        // must touch road.
        return true;
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

/**
 * 
 * @param {string} playerId
 * @param {array} edge
 */
Board.prototype.isValidRoad = function (playerId, edge) {
    var intersections = components.intersections,
        roads = this.roads,
        // Check to see if start and end are valid intersections.
        startId = edge[0],
        endId = edge[1],
        startIntersection = utils.getTileIdsFromIntersectionId(startId),
        endIntersection = utils.getTileIdsFromIntersectionId(endId);

    if (intersections.indexOf(startId) < 0 || intersections.indexOf(endId) < 0) {
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
    var isLegal = _.some(roads.byPlayerId(playerId), function (road) {
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
    return true;
};

/**
 * 
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

/**
 * 
 * @param {number} tileId
 */
Board.prototype.moveRobber = function (tileId) {
    this.robber = tileId;
};
