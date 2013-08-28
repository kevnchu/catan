module.exports = HexLayout;

var utils = require('./utils'),
    components = require('./components'),
    tileIdLayout =  components.tileIdLayout,
    tileGridMap = components.tileGridMap,
    adjacencyMap = components.tileAdjacencyMap,
    intersectionCoordinateMap = {},
    ROOT3 = Math.sqrt(3),
    // anticlockwise order starting from 9:00 point
    hexCoordinates = [
        [0, ROOT3 / 2],
        [1 / 2, ROOT3],
        [3 / 2, ROOT3],
        [2, ROOT3 / 2],
        [3 / 2, 0],
        [1 / 2, 0]
    ],
    verticalOffsets = [ROOT3, ROOT3 / 2, 0, ROOT3 / 2, ROOT3];

/**
 * returns the euclidean distance from p1 to p2.
 * @param {array} p0
 * @param {array} p1
 */
function distance(p0, p1) {
    return Math.sqrt(Math.pow(p0[0] - p1[0], 2) + Math.pow(p0[1] - p1[1], 2));
}

/**
 * layout class
 * @param {number} size size in pixels of the edge length of a tile piece.
 */
function HexLayout(size) {
    var layout = [],
        columns = [3, 4, 5, 4, 3],
        column,
        colOffset,
        colSize,
        adjacent,
        intersection,
        hexPiece = hexCoordinates.map(function (p) {
            return [p[0] * size, p[1] * size];
        }),
        i, j, p, x, y, tileId;

    for (colIndex = 0; colIndex < columns.length; colIndex++) {
        colSize = columns[colIndex];
        colOffset = verticalOffsets[colIndex];
        for (i = 0; i < colSize; i++) {
            tileId = tileIdLayout[colIndex][i];
            column = [];
            intersectionCoordinateMap[tileId] = column;
            adjacent = adjacencyMap[tileId];
            for (j = 0; j < 6; j++) {
                p = hexPiece[j];
                x = p[0] + (colIndex * (3/2) * size);
                y = p[1] + (i * ROOT3 * size) + (colOffset * size);
                intersection = [tileId, adjacent[j], adjacent[(j + 5) % 6]];
                column.push({p: [x, y], intersectionId: utils.getIntersectionId(intersection)});
            }

            layout.push(column);
        }
    }

    this.size = size;
    this.layout = layout;
}

/**
 * returns all of the intersection points of the board.
 */
HexLayout.prototype.getIntersectionCoordinates = function () {
    return this.layout;
};

/**
 * returns the coordinates of the given intersection.
 * @param {string} intersectionId
 */
HexLayout.prototype.getIntersectionCoordinatesById = function (intersectionId) {
    var tileIds = utils.getTileIdsFromIntersectionId(intersectionId),
        adjacent = adjacencyMap[tileIds[0]],
        p1,
        p2;
    p1 = adjacent.indexOf(tileIds[1]);
    p2 = adjacent.indexOf(tileIds[2]);
    // make sure that tiles are adjacent to tileIds[0]
    if (p1 >= 0 && p2 >= 0) {
        // make sure that tileIds[1] and tileIds[2] are adjacent to each other
        if (Math.abs(p1 - p2) === 1) {
            return intersectionCoordinateMap[tileIds[0]][Math.max(p1, p2)].p;
        }
        // special case
        if (Math.abs(p1 - p2) === 5) {
            return intersectionCoordinateMap[tileIds[0]][0].p;
        }
    }
};

/**
 * returns coordinates of the given tile.
 * @param {string | number} tileId
 */
HexLayout.prototype.getTileCoordinates = function (tileId) {
    var coordinates = tileGridMap[tileId],
        size = this.size,
        verticalOffset = verticalOffsets[coordinates[0]],
        x = size * 3 / 2 * coordinates[0],
        y = (size * ROOT3 * coordinates[1]) + (size * verticalOffset);
    return [x, y];
};
