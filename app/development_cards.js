module.exports = DevelopmentCards;

var utils = require('./utils');

var cardMap = {
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

function addCard(deck, type, n) {
    var i;
    for (i = 0; i < n; i++) {
        deck.push(type);
    }
}

function createDeck() {
    var cards = {
            knight: 14,
            road_building: 2,
            monopoly: 2,
            year_of_plenty: 2,
            victory_point: 5
        },
        deck = [],
        type;
    
    for (type in cards) {
        if (cards.hasOwnProperty(type)) {
            addCard(deck, type, cards[type]);
        }
    }
    return utils.shuffleArray(deck);
}

function DevelopmentCards() {
    this.deck = createDeck();
}

DevelopmentCards.prototype = {
    /**
     * returns the top card of the deck. card is just a string.
     */
    draw: function () {
        return this.deck.pop();
    }
};
