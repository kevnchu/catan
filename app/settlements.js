module.exports = Settlements;

function Settlements () {
    this.settlements = [];
}

Settlements.prototype = {
    add: function (settlement) {
        this.settlements.push(settlement);
    },

    byPlayerId: function (playerId) {
        return this.settlements.filter(function (settlement) {
            return settlement.playerId === playerId;
        });
    },

    byIntersectionId: function (intersectionId) {
        return this.settlements.filter(function (settlement) {
            return settlement.intersectionId === intersectionId;
        });
    },

    some: function (fn) {
        return this.settlements.some(fn);
    },

    every: function (fn) {
        return this.settlements.every(fn);
    },

    each: function (fn) {
        this.settlements.forEach(fn);
    },

    filter: function (fn) {
        return this.settlements.filter(fn);
    }
};
