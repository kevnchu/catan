define(['utils', 'hex', 'components'], function (utils, hex, components) {
    var svgNS = 'http://www.w3.org/2000/svg',
        catanNS = 'catan',
        robber,
        playerMap,
        resourceMap,
        diceMap,
        tileDiceValueMap,
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
            hexLayout,
            hexCoords,
            resourceType,
            tileId,
            resourceTileColorMap = components.resourceTileColorMap,
            flattenCoords = function (x) { return x.p; },
            i;

        resourceMap = boardData.resourceMap;
        diceMap = boardData.diceMap;
        tileDiceValueMap = boardData.tileDiceValueMap;
        playerMap = boardData.playerMap;
        layout = hex.createLayout(config.size);
        hexLayout = layout.getIntersectionCoordinates();

        // add event listener to board.
        board.addEventListener('click', function (e) {
            var target = e.target,
                intersectionId,
                coordinates,
                tileId;
            // determine if intersection or tile.
            if (target.tagName === 'circle') {
                intersectionId = target.getAttributeNS(catanNS, 'intersectionId');
                coordinates = layout.getIntersectionCoordinatesById(intersectionId);
                pubsubz.publish('select-intersection', intersectionId);
            }
            else if (target.tagName === 'polygon') {
                tileId = target.getAttributeNS(catanNS, 'tileId');
                coordinates = layout.getTileCoordinates(tileId);
            }
        });

        hexNode.setAttribute('border', '1px solid black');

        for (i = 0; i < hexLayout.length; i++) {
            tileId = tileIdArray[i];
            resourceType = resourceMap[tileId].type;
            hexCoords = hexLayout[i].map(flattenCoords);
            hexNode = hexNode.cloneNode();
            hexNode.setAttribute('points', hexCoords.join(' '));
            hexNode.setAttributeNS(catanNS, 'tileId', tileId);
            hexNode.setAttribute('fill', resourceTileColorMap[resourceType]);
            chitNode = chitNode.cloneNode();
            chitNode.textContent = tileDiceValueMap[tileId];
            chitNode.setAttribute('x', hexCoords[0][0] + config.size - 5);
            chitNode.setAttribute('y', hexCoords[0][1]);
            board.appendChild(hexNode);
            board.appendChild(chitNode);
            drawIntersections(board, hexLayout[i]);
        }
        svg.appendChild(board);
    }

    /**
     * Renders the card that shows how many resources each building
     * costs.
     */
    function drawResourceKey() {
        var card = document.createElement('img');
        card.src = 'images/key.png';
        document.body.appendChild(card);
    }

    function drawIntersections(board, intersections) {
        var target = document.createElementNS(svgNS, 'circle'),
            //coords = intersections.map(function (x) { return x.p; }),
            intersection,
            p,
            i;
        target.setAttribute('fill', '#ABC');
        target.setAttribute('r', '5');
        for (i = 0; i < intersections.length; i++) {
            intersection = intersections[i];
            p = intersection.p;
            target = target.cloneNode();
            target.setAttributeNS(catanNS, 'intersectionId', intersection.intersectionId);
            target.setAttribute('cx', p[0]);
            target.setAttribute('cy', p[1]);
            board.appendChild(target);
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

    function moveRobber(tileId) {
        var coordinates = tileCoordinates[tileId];
        robber.setAttribute('x', coordinates[0]);
        robber.setAttribute('y', coordinates[1]);
    }

    return {
        drawResourceKey: drawResourceKey,
        drawBoard: drawBoard,
        drawRoad: drawRoad,
        drawSettlement: drawSettlement
    };
});
