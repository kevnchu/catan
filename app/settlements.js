module.exports = Settlements;

var _ = require('lodash');

function Settlements () {
    this.settlements = [];
}

Settlements.prototype = {
    add: function (settlement) {
        this.settlements.push(settlement);
    },

    byPlayerId: function (playerId) {
        return this.settlements.filter(function (x) {
            return x.playerId === playerId;
        });
    },

    byIntersectionId: function (intersectionId) {
        return this.settlements.filter(function (x) {
            return x.intersectionId === intersectionId;
        });
    },

    some: function (fn) {
        return _.some(this.settlements, fn);
    },

    every: function (fn) {
        return _.every(this.settlements, fn);
    },

    each: function (fn) {
        _.forEach(this.settlements, fn);
    }
};
