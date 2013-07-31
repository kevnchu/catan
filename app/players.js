exports.Players = Players;

function Players() {
    this.players = [];
    this.playerMap = {};
    this.playerCounter = 0;
}

/**
 * Adds a new player to the list of players.
 * @param {object} player
 */
Players.prototype.newPlayer = function (player) {
    if (this.players.length < 4) {
        this.players.push(player);
        this.playerMap[player.id] = player;
    } else {
        console.log('Game is full');
    }
};

/**
 * Moves the current player to next player.
 */
Players.prototype.next = function () {
    var numPlayers = this.players.length;
    if (numPlayers > 0) {
        this.playerCounter = (this.playerCounter + 1) % numPlayers;
        return this.players[this.playerCounter];
    }
};

/**
 * Moves the current player to the previous player.
 */
Players.prototype.previous = function () {
    var numPlayers = this.players.length;
    if (numPlayers > 0) {
        this.playerCounter = this.playerCounter - 1;
        if (this.playerCounter < 0) {
            this.playerCounter = this.players.length - 1;
        }
        return this.players[this.playerCounter];
    }
};

/**
 * returns the player with the given id.
 * @param {string} id
 */
Players.prototype.getPlayer = function (id) {
    return this.playerMap[id];
};

/**
 * returns the current player.
 */
Players.prototype.getCurrent = function () {
    return this.players[this.playerCounter];
};

/**
 * Sets the current player to player with given id.
 * @param {string} id
 */
Players.prototype.setCurrent = function (id) {
    var players = this.players,
        i;
    for (i = 0; i < players.length; i++) {
        if (id === players[i].id) {
            this.playerCounter = i;
            return;
        }
    }
};

/**
 * Marks player with given id as the starting player.
 * @param {string} id
 */
Players.prototype.setStartPlayer = function (id) {
    this.startingPlayer = id;
    this.setCurrent(id);
};

/**
 * Resets pc to starting player.
 */
Players.prototype.reset = function () {
    this.setCurrent(this.startingPlayer);
};

/**
 * returns the number of players.
 */
Players.prototype.count = function () {
    return this.players.length;
};
