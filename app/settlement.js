var Settlement,
    intersectionMap = require('./components').intersectionMap;

exports.Settlement = Settlement;

Settlement = function (intersectionId, playerId) {
    this.type = 'settlement';
    this.intersectionId = intersectionId;
    this.playerId = playerId;
};

Settlement.prototype.toString = function () {
    return this.playerId + ' has a ' + this.type + ' on ' + this.intersectionId;
};

Settlement.prototype.isAdjacentTo = function (tileId) {
    var intersectionArray = intersectionMap[this.intersectionId];
    return intersectionArray.indexOf(tileId) >= 0;
};
