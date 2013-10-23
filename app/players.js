module.exports = Players;

var colors = ['red', 'orange', 'white', 'blue'];
function Players() {
    this.players = [];
    this.playerMap = {};
    this.playerCounter = 0;
}

/**
 * Adds a new player to the list of players.
 * @param {object} player
 */
Players.prototype.addPlayer = function (player) {
    if (this.players.length < 4) {
        player.color = colors.pop();
        player.name = player.name.replace(/((?![a-zA-Z0-9]).)*/g, '');
        this.players.push(player);
        this.playerMap[player.id] = player;
    } else {
        console.log('Game is full');
    }
};

Players.prototype.removePlayer = function (id) {
    var players = this.players,
        playerMap = this.playerMap,
        player,
        i;
    for (i = 0; i < players.length; i++) {
        player = players[i];
        if (player.id === id) {
            players.splice(i, 1);
            delete playerMap[id];
            player = null;
            this.playerCounter--;
        }
    }
};

/**
 * Moves the current player to next player.
 */
Players.prototype.next = function () {
    var numPlayers = this.players.length;
    if (numPlayers > 0) {
        this.playerCounter = (this.playerCounter + 1) % numPlayers;
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
    }
};

/**
 * returns the player with the given id.
 * @param {string} id
 */
Players.prototype.getPlayer = function (id) {
    return this.playerMap[id];
};

Players.prototype.getName = function (id) {
    var player = this.getPlayer(id);
    return player.name;
};

/**
 * returns the current player.
 */
Players.prototype.getCurrent = function () {
    return this.players[this.playerCounter];
};

Players.prototype.getSerializablePlayerMap = function () {
    var serializableMap = {},
        serializableProperties = ['id', 'name', 'points', 'color', 'knights', 'hasLongestRoad', 'hasLargestArmy'],
        playerMap = this.playerMap,
        player,
        playerId,
        copyProps = function (player) {
            var i,
            prop,
            copy = {};
            for (i = 0; i < serializableProperties.length; i++) {
                prop = serializableProperties[i];
                copy[prop] = player[prop];
            }
            return copy;
        };

    for (playerId in playerMap) {
        if (playerMap.hasOwnProperty(playerId)) {
            player = playerMap[playerId];
            serializableMap[playerId] = copyProps(player);
        }
    }
    return serializableMap;
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
