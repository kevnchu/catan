var Settlements;

exports.Settlements = Settlements;

Settlements = function (intersectionId, playerId) {
    this.settlements = [];
};

Settlements.prototype = {
    add: function (settlement) {
        this.settlements.push(settlement);
    },

    byPlayerId: function (playerId) {
        return this.settlements.filter(function (x) {
            return x.playerId === playerId;
        });
    },

    each: function (fn) {
        var settlements = this.settlements,
            i;
        for (i = 0; i < settlements; i++)
            fn(settlements[i]);
    }
};
