module.exports = longestPath;

function longestPath(edges) {
    var max = 1,
        visited = [],
        depth,
        edge,
        left,
        right,
        i;
    
    if (!edges.length) {
        return 0;
    }
    for (i = 0; i < edges.length; i++) {
        edge = edges[i];
        if (visited.indexOf(edge) < 0) {
            visited.push(edge);
            left = traverse(edge[0], edge, visited, edges, 1);
            right = traverse(edge[1], edge, visited, edges, 0);
            depth = left + right; 
            if (!left || !right)
                depth -= 1;
            if (depth > max)
                max = depth;
        }
    }
    return max;
}

function traverse(vertex, current, visited, edges, n) {
    var adj = getAdjacentEdges(vertex, current, edges),
        result,
        i;
    if (!adj.length) {
        return n;
    }
    result = adj.filter(function (edge) {
        if (visited.indexOf(edge) < 0) {
            visited.push(edge);
            return true;
        }
    }).map(function (edge) {
        var v = getAdjacentVertex(edge, vertex);
        return traverse(v, edge, visited, edges, n + 1);
    });
    // handle the case where result = []. ie there are no adjacent edges
    result.push(0);
    return Math.max.apply(this, result );
}

/**
 * given and edge and a vertex connected to it, returns the opposing
 * vertex.
 * @param {array} edge pair of vertices
 * @param {string} v one of the vertices connected by edge
 */
function getAdjacentVertex(edge, v) {
    return edge[0] === v ? edge[1] : edge[0];
}

function getAdjacentEdges(vertex, edge, edges) {
    return edges.filter(function (e) {
        return !equal(edge, e) && isAdjacent(vertex, e);
    });
}
                        
function isAdjacent(vertex, edge) {
    return vertex === edge[0] || vertex === edge[1];
}

function equal(edge1, edge2) {
    return (edge1[0] === edge2[0] || edge1[0] === edge2[1]) &&
        (edge1[1] === edge2[0] || edge1[1] === edge2[1]);
}
