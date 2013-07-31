var DevelopmentCards;
exports.DevelopmentCards = DevelopmentCards;

/**
 * Helper method creates n cards of the specified type.
 * Returns cards as array.
 * @param {String} type
 * @param {Number} n
 */
function createCard(type, n) {
    var cards = [],
        i;
    for (i = 0; i < n; i++) {
        cards.push(type);
    }
}

DevelopmentCards = function () {
    // 14 knights
    // 2 road building
    // 2 monopoly
    // 2 year of plenty
    // 5 victory points
    this.deck = [];
    createCard('knight', 14);
    createCard('road_building', 2);
    createCard('monopoly', 2);
    createCard('year_of_plenty', 2);
    createCard('victory_point', 5);

    // TODO Shuffle deck


    this.card_map = {
      knight: {
        name: 'Knight',
        description: 'Move the robber and take a card from an opponent adjacent to robber location.'
      },
      road_building: {
        name: 'Road Building',
        description: 'Build a new road for free.'
      },
      monopoly: {
        name: 'Monopoly',
        description: "Name a resource type and take all of your opponents' resources of that type."
      },
      year_of_plenty: {
        name: 'Year of Plenty',
        description: 'Take two free resources of the same type.'
      },
      victory_point: {
        name: 'Victory Point',
        description: '1 Victory Point.'
      }
    };
};

DevelopmentCards.prototype.draw = function () {
    return this.deck.pop();
};
