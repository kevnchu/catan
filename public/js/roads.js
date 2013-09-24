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
        return this.roads.filter(function (x) {
            return x.playerId === playerId;
        });
    },

    some: function (fn) {
        return _.some(this.roads, fn);
    },

    every: function (fn) {
        return _.every(this.roads, fn);
    },

    each: function (fn) {
        _.forEach(this.roads, fn);
    }
};
