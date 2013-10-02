module.exports = Roads;

var longestPath = require('./longest_path');

function Roads() {
    this.roads = [];
}

Roads.prototype = {
    add: function (road) {
        this.roads.push(road);
    },

    longestPath: function (playerId) {
        var edges = this.roads.filter(function (road) {
            return road.playerId === playerId;
        }).map(function (road) {
            return road.edge;
        });
        return longestPath(edges);
    },

    byPlayerId: function (playerId) {
        return this.roads.filter(function (road) {
            return road.playerId === playerId;
        });
    },

    some: function (fn) {
        return this.roads.some(fn);
    },

    every: function (fn) {
        return this.roads.every(fn);
    },

    each: function (fn) {
        this.roads.forEach(fn);
    }
};
