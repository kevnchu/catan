exports.Road = Road;

function Road(p1, p2, playerId) {
    this.playerId = playerId;
    this.edge = [p1, p2];
}

Road.prototype = {
    includes: function (p) {
        return this.edge.indexOf(p) >= 0;
    }
};
