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

    each: function (fn) {
        var roads = this.roads,
            i;
        for (i = 0; i < roads.length; i++)
            fn(roads[i]);
    }
};
