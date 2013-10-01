module.exports = {
    drawResources: drawResources,
    drawBoard: drawBoard,
    drawRoad: drawRoad,
    drawSettlement: drawSettlement,
    highlightIntersections: highlightIntersections,
    highlightEdges: highlightEdges,
    clearHighlighted: clearHighlighted
};

var HexLayout = require('./hex_layout'),
    components = require('./components'),
    svgNS = 'http://www.w3.org/2000/svg',
    catanNS = 'catan',
    robber,
    playerMap,
    layout;

/**
 * Draws initial board state.
 * @param {object} boardData describes where resource tiles are placed
 * and what the dice values are.
 */
function drawBoard(boardData, config) {
    var svg = document.querySelector('svg'),
        board = document.createElementNS(svgNS, 'g'),
        hexes = [],
        hexNode = document.createElementNS(svgNS, 'polygon'),
        chitNode = document.createElementNS(svgNS, 'text'),
        tileIdArray = components.tileIdLayout.reduce(function (a, b) {
            return a.concat(b);
        }),
        flattenCoords = function (x) { return x.p; },
        resourceMap = boardData.resourceMap,
        tileDiceValueMap = boardData.tileDiceValueMap,
        intersectionCoords,
        hexCoords,
        resourceType,
        tileId,
        i;

    playerMap = boardData.playerMap;
    layout = new HexLayout(config.size);
    intersectionCoords = layout.getIntersectionCoordinates();

    // add event listener to board.
    board.addEventListener('click', function (e) {
        var target = e.target,
            intersectionId,
            edge,
            tileId;
        // determine if intersection or tile.
        if (target.tagName === 'circle') {
            intersectionId = target.getAttributeNS(catanNS, 'intersectionId');
            pubsubz.publish('select-intersection', intersectionId);
        } else if (target.tagName === 'line') {
            edge = target.getAttributeNS(catanNS, 'edge').split('+');
            pubsubz.publish('select-edge', edge);
        } else if (target.tagName === 'polygon') {
            tileId = target.getAttributeNS(catanNS, 'tileId');
        }
    });

    hexNode.setAttribute('border', '1px solid black');

    for (i = 0; i < intersectionCoords.length; i++) {
        tileId = tileIdArray[i];
        resourceType = resourceMap[tileId].type;
        hexCoords = intersectionCoords[i].map(flattenCoords);
        hexNode = hexNode.cloneNode();
        hexNode.setAttribute('points', hexCoords.join(' '));
        hexNode.setAttributeNS(catanNS, 'tileId', tileId);
        hexNode.className.baseVal = resourceType + '-tile';
        chitNode = chitNode.cloneNode();
        chitNode.textContent = tileDiceValueMap[tileId];
        chitNode.setAttribute('x', hexCoords[0][0] + config.size - 5);
        chitNode.setAttribute('y', hexCoords[0][1]);
        board.appendChild(hexNode);
        board.appendChild(chitNode);
    }
    drawEdges(board, components.edges);
    drawIntersections(board, intersectionCoords.reduce(function (prev, current) {
        return prev.concat(current);
    }));
    svg.appendChild(board);
}

function drawResources(resources) {
    var resourcesContainer = $('.resources-container'),
        cells = resourcesContainer.find('td');
    cells.each(function (i, node) {       
        var type = node.getAttribute('data-resource');
        node.textContent = resources[type] || 0;
    });
}

function drawIntersections(board, intersections) {
    var target = document.createElementNS(svgNS, 'circle'),
        unique = {},
        intersection,
        intersectionId,
        p,
        i;
    target.classList.add('intersection');
    target.setAttribute('r', '9');
    for (i = 0; i < intersections.length; i++) {
        intersection = intersections[i];
        intersectionId = intersection.intersectionId;
        if (!unique[intersectionId]) {
            p = intersection.p;
            target = target.cloneNode();
            target.setAttributeNS(catanNS, 'intersectionId', intersectionId);
            target.setAttribute('cx', p[0]);
            target.setAttribute('cy', p[1]);
            board.appendChild(target);
            unique[intersectionId] = 1;
        }
    }
}

function drawEdges(board, edges) {
    var edgeElement = document.createElementNS(svgNS, 'line'),
        edge,
        startId,
        endId,
        p0,
        p1,
        i;

    edgeElement.classList.add('edge');
    for (i = 0; i < edges.length; i++) {
        edge = edges[i];
        p0 = layout.getIntersectionCoordinatesById(edge[0]);
        p1 = layout.getIntersectionCoordinatesById(edge[1]);
        edgeElement = edgeElement.cloneNode();
        edgeElement.setAttribute('x1', p0[0]);
        edgeElement.setAttribute('y1', p0[1]);
        edgeElement.setAttribute('x2', p1[0]);
        edgeElement.setAttribute('y2', p1[1]);
        edgeElement.setAttributeNS(catanNS, 'edge', edge.join('+'));
        board.appendChild(edgeElement);
    }
}

function drawSettlement(settlement) {
    var board = $('svg'),
        settlementNode = document.createElementNS(svgNS, 'image'),
        color = playerMap[settlement.playerId].color,
        url = 'images/' + color + '-settlement.png',
        intersectionId = settlement.intersectionId,
        p = layout.getIntersectionCoordinatesById(intersectionId);
    settlementNode.setAttributeNS('http://www.w3.org/1999/xlink', 'href', url);
    settlementNode.setAttribute('height', '20px');
    settlementNode.setAttribute('width', '20px');
    settlementNode.setAttribute('x', p[0]);
    settlementNode.setAttribute('y', p[1]);
    board.append(settlementNode);
}

function drawRoad(road) {
    var board = $('svg'),
        roadNode = document.createElementNS(svgNS, 'line'),
        color = playerMap[road.playerId].color,
        edge = road.edge,
        intersectionId0 = edge[0],
        intersectionId1 = edge[1],
        p0 = layout.getIntersectionCoordinatesById(intersectionId0),
        p1 = layout.getIntersectionCoordinatesById(intersectionId1);
    roadNode.setAttribute('x1', p0[0]);
    roadNode.setAttribute('y1', p0[1]);
    roadNode.setAttribute('x2', p1[0]);
    roadNode.setAttribute('y2', p1[1]);
    roadNode.setAttribute('stroke', color);
    roadNode.setAttribute('stroke-width', '5px');
    board.append(roadNode);
}

function drawRobber(tileId) {
    var board = $('svg'),
        coordinates = tileCoordinates[tileId],
        url = 'images/robber.png';
    robber = document.createElementNS(svgNS, 'image');
    robber.setAttributeNS('http://www.w3.org/1999/xlink', 'href', url);
    robber.setAttribute('height', '20px');
    robber.setAttribute('width', '20px');
    robber.setAttribute('x', coordinates[0] + 30);
    robber.setAttribute('y', coordinates[1] + 20);
    board.append(robber);
}

/**
 * @param {array} intersections array of intersection ids
 */
function highlightIntersections(intersections) {
    var i,
        intersection;
    for (i = 0; i < intersections.length; i++) {
        intersection = getIntersectionById(intersections[i]);
        intersection.classList.add('highlight');
    }
}

function highlightEdges(edges) {
    var i,
        edge;
    for (i = 0; i < edges.length; i++) {
        edge = getEdgeById(edges[i].join('+'));
        edge.classList.add('highlight');
    }
}

function getIntersectionById(intersectionId) {
    var intersections = getIntersections(),
        i;
    for (i = 0; i < intersections.length; i++) {
        if (intersections[i].getAttributeNS(catanNS, 'intersectionId') === intersectionId) {
            return intersections[i];
        }
    }
}

function getEdgeById(edgeId) {
    var edges = getEdges(),
        i;
    for (i = 0; i < edges.length; i++) {
        if (edges[i].getAttributeNS(catanNS, 'edge') === edgeId) {
            return edges[i];
        }
    }
}

function getIntersections() {
    return $('circle.intersection');
}

function getEdges() {
    return $('line.edge');
}

function clearHighlighted() {
    var intersections = getIntersections(),
        edges = getEdges();
    _.each(intersections, function (node, id) {
        node.classList.remove('highlight');
    });
    _.each(edges, function (node, id) {
        node.classList.remove('highlight');
    });
}

function moveRobber(tileId) {
    var coordinates = tileCoordinates[tileId];
    robber.setAttribute('x', coordinates[0]);
    robber.setAttribute('y', coordinates[1]);
}
