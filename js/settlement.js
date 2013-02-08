var Settlement;

exports.Settlement = Settlement;

Settlement = function (location, playerId) {
    this.type = 'settlement';
    this.location = location;
    this.playerId = playerId;
};

Settlement.prototype = {
    toString: function () {
        return this.playerId + ' has a ' + this.type + ' on ' + this.location;
    }
};
