module.exports = Roads;

function Roads() {
    this.roads = [];
}

Roads.prototype = {
    add: function (road) {
        this.roads.push(road);
    },

    longestPath: function () {
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
