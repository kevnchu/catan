var Roads = require ('./roads').Roads;

exports.Player = Player;

function Player(name, socket) {
    // TODO create actual id.
    this.id = name;
    this.name = name;
    this.socket = socket;
    this.points = 0;
    this.settlements = [];
    this.roads = new Roads();
    this.resources = {
      wood: 0,
      stone: 0,
      brick: 0,
      wheat: 0,
      sheep: 0
    };
    this.devCards = [];
}
