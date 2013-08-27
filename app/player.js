exports.Player = Player;

var createUniqueId = require('./utils').createUniqueId;

function Player(name, socket) {
    this.id = createUniqueId();
    this.name = name;
    if (socket)
        this.socket = socket;
    this.points = 0;
    this.resources = {
        wood: 0,
        stone: 0,
        brick: 0,
        wheat: 0,
        sheep: 0
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
