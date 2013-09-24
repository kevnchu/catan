module.exports = Player;

var createUniqueId = require('./utils').createUniqueId;

function Player(name, socket) {
    this.id = createUniqueId();
    this.name = name;
    if (socket)
        this.socket = socket;
    this.points = 0;
    this.resources = {
        brick: 4,
        sheep: 4,
        stone: 4,
        wheat: 4,
        wood: 4
    };
    this.devCards = [];
    this.color = null;
}

Player.prototype = {
    serialize: function () {
        var prop,
            self = this,
            obj = {};
        for (prop in self) {
            if (self.hasOwnProperty(prop) && prop !== 'socket') {
                obj[prop] = self[prop];
            }
        }
        return obj;
    }
};
