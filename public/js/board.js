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
    var self = this;
    self.settlements = new Settlements();
    self.roads = new Roads();
    self.resourceMap = boardData.resourceMap;
    self.diceMap = boardData.diceMap;
    self.tileDiceValueMap = boardData.tileDiceValueMap;
    self.playerMap = boardData.playerMap;
    self.moveRobber(self.diceMap[7][0]);
}

/**
 * @param {string} playerId
 */
Board.prototype.getValidIntersections = function (playerId) {
    var self = this,
        intersections = components.intersections;
    return intersections.filter(function (intersectionId) {
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
        edges = edges.filter(function (edge) {
            return edge[0] === intersectionId || edge[1] === intersectionId;
        });
    }
    return edges.filter(function (edge) {
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
