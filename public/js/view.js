module.exports = {
    drawResources: drawResources,
    drawBoard: drawBoard,
    drawRoad: drawRoad,
    drawSettlement: drawSettlement,
    drawCity: drawCity,
    updatePlayerInfo: updatePlayerInfo,
    drawDevCards: drawDevCards,
    highlightIntersections: highlightIntersections,
    highlightEdges: highlightEdges,
    clearHighlighted: clearHighlighted,
    moveRobber: moveRobber
};

var HexLayout = require('./hex_layout'),
    components = require('./components'),
    utils = require('./utils'),
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

    board.setAttribute('transform', 'translate(20 20)');
    playerMap = boardData.playerMap;
    layout = new HexLayout(config.size);
    intersectionCoords = layout.getIntersectionCoordinates();

    // add event listener to board.
    board.addEventListener('click', function (e) {
        var target = e.target,
            tagName = target.tagName,
            highlighted = target.classList.contains('highlight'),
            intersectionId,
            edge,
            tileId;
        // determine if intersection or tile.
        if (highlighted && tagName === 'circle') {
            intersectionId = target.getAttributeNS(catanNS, 'intersectionId');
            pubsubz.publish('select-intersection', intersectionId);
        } else if (highlighted && tagName === 'line') {
            edge = target.getAttributeNS(catanNS, 'edge').split('+');
            pubsubz.publish('select-edge', edge);
        } else if (tagName === 'polygon') {
            tileId = target.getAttributeNS(catanNS, 'tileId');
            pubsubz.publish('select-tile', tileId);
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
    drawPlayers(playerMap);
    svg.appendChild(board);
    drawRobber(boardData.diceMap[7][0]);
}

function drawResources(resources) {
    var resourcesContainer = $('.resources-container'),
        img = document.createElement('img'),
        frag = document.createDocumentFragment(),
        cardNode,
        resource,
        count,
        i;
    img.classList.add('resource-card');
    for (resource in resources) {
        if (resources.hasOwnProperty(resource)) {
            count = resources[resource];
            img.dataset.resourceType = resource;
            img.setAttribute('src', 'images/' + resource + '-card.png');
            console.log(count);
            for (i = 0; i < count; i++) {
                cardNode = img.cloneNode();
                frag.appendChild(cardNode);
            }
        }
    }
    resourcesContainer.on('click', function (e) {
        if (e.target.classList.contains('resource-card')) {
            var target = e.target;
            target.classList.toggle('highlight');
            pubsubz.publish('select-resource', target.dataset.resourceType);
        }
    });
    resourcesContainer.append(frag);
}

function drawDevCards(devCards) {
    var target = document.querySelector('.devcard-container'),
        cardNode,
        frag,
        i;
    while (target.firstChild) {
        target.removeChild(target.firstChild);
    }
    if (devCards.length) {
        frag = document.createDocumentFragment();
        cardNode = document.createElement('span');
        cardNode.classList.add('.devcard');
        for (i = 0; i < devCards.length; i++) {
            cardNode = cardNode.cloneNode();
            cardNode.textContent = devCards[i];
            frag.appendChild(cardNode);
        }
        target.appendChild(frag);
    }
}

function drawPlayers(playerMap) {
    var player,
        playerId,
        template = utils.template,
        frag = document.createDocumentFragment(),
        templateStr = '<div class="player-info" data-player-id="{{id}}">' +
                '<img src="images/{{color}}-settlement.png" />' +
                '<span class="player-name">{{name}}</span>' +
                '<span>Knights: <span class="knight-count">{{knights}}</span></span>' +
                '<span>Victory points: <span class="victory-points">{{points}}</span></span>' +
            '</div>',
        node,
        clickHandler = function (e) {
            pubsubz.publish('select-player', this.dataset.playerId);
        };
    for (playerId in playerMap) {
        if (playerMap.hasOwnProperty(playerId)) {
            player = playerMap[playerId];
            node = template(templateStr, player);
            node.addEventListener('click', clickHandler);
            frag.appendChild(node);
        }
    }
    $('.player-container').append(frag);
}

function updatePlayerInfo(player) {
    var players = document.querySelectorAll('.player-info'),
        playerNode,
        i;
    for (i = 0; i < players.length; i++) {
        playerNode = players[i];
        if (playerNode.dataset.playerId === player.id) {
            playerNode.querySelector('.knight-count').textContent = player.knights;
            playerNode.querySelector('.victory-points').textContent = player.points;
            return true;
        }
    }
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
    var board = $('svg g'),
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
    var board = $('svg g'),
        roadNode = document.createElementNS(svgNS, 'line'),
        color = playerMap[road.playerId].color,
        edge = road.edge,
        intersectionId0 = edge[0],
        intersectionId1 = edge[1],
        p0 = layout.getIntersectionCoordinatesById(intersectionId0),
        p1 = layout.getIntersectionCoordinatesById(intersectionId1);
    roadNode.classList.add('road');
    roadNode.setAttribute('x1', p0[0]);
    roadNode.setAttribute('y1', p0[1]);
    roadNode.setAttribute('x2', p1[0]);
    roadNode.setAttribute('y2', p1[1]);
    roadNode.setAttribute('stroke', color);
    roadNode.setAttribute('stroke-width', '5px');
    board.append(roadNode);
}

function drawCity() {
}

function drawRobber(tileId) {
    var board = $('svg g'),
        url = 'images/robber.png';
    robber = document.createElementNS(svgNS, 'image');
    robber.setAttributeNS('http://www.w3.org/1999/xlink', 'href', url);
    robber.setAttribute('height', '20px');
    robber.setAttribute('width', '20px');
    moveRobber(tileId);
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
    var coordinates = layout.getTileCoordinates(tileId);
    robber.setAttribute('x', coordinates[0] + 30);
    robber.setAttribute('y', coordinates[1] + 20);
}
