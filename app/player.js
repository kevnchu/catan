var Roads = require('./roads').Roads,
    createUniqueId = require('./utils').createUniqueId;

exports.Player = Player;

function Player(name, socket) {
    this.id = createUniqueId();
    this.name = name;
    this.socket = socket;
    this.points = 0;
    this.settlements = [];
    this.roads = [];
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
