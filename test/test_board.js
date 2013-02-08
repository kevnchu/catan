var Board = require('../js/board.js').Board;
var assert = require('assert');

describe('Board', function () {
    var b;
    beforeEach(function () {
        b = new Board();
    });

    describe('#placeSettlement', function () {
        var player;
        beforeEach(function () {
            // mock player
            player = {
                id: 'test',
                name: 'test',
                settlements: [],
                roads: [{
                    edge: [[1,12,13], [0,1,12]]
                }],
                resources: {
                    wood: 0,
                    wheat: 0,
                    brick: 0,
                    stone: 0,
                    sheep: 0
                }
            };
        });

        // TODO this should be separate function
        it('should check to see if location is valid', function () {
            var location;
            var settlement;
            location = [1,14,5]
            settlement = b.placeSettlement(player, location);
            assert.ok(!settlement);

            location = [1,12,13];
            settlement = b.placeSettlement(player, location);
            assert.ok(settlement);
        });

        it('should check that location is not within 2 roads of an existing settlement.', function () {
            b.settlements = [{
                location: [1,12,13]
            }];
            var location = [1,12,13];
            var settlement = b.placeSettlement(player, location);
            assert.ok(!settlement);

            b.settlements = [{
                location: [0,1,12]
            }];
            settlement = b.placeSettlement(player, location);
            assert.ok(!settlement);
        });
        it('should check that location is connected to a road', function () {
            // TODO
            assert.ok();
        });
    });

    describe('#initResourceLocations', function () {
        it('should not throw errors', function () {
            //assert.doesNotThrow(b.initResourceLocations);
            b.initResourceLocations();
            assert.ok(b.resourceMap);
        });
    });

    describe('#initResourceValues', function () {
        it('should not throw errors', function () {
            //assert.doesNotThrow(b.initResourceValues);
            b.initResourceLocations();
            b.initResourceValues();
            assert.ok(b.diceMap);
        });
    });

    describe('#distributeResources', function () {
        var player;
        beforeEach(function () {
            player = {
                resources: {
                    wood: 0,
                    wheat: 0,
                    brick: 0,
                    stone: 0,
                    sheep: 0
                }
            };
            b.resourceMap = {
                0: 'wood', 1: 'wood', 2: 'wood',
                3: 'wood', 4: 'wheat', 5: 'wheat',
                6: 'wheat', 7: 'wheat', 8: 'sheep',
                9: 'sheep', 10: 'sheep', 11: 'sheep',
                12: 'stone', 13: 'stone', 14: 'stone',
                15: 'brick', 16: 'brick', 17: 'brick'
            };
        });
        it('should add one to the corresponding resource type.', function () {
            b.distributeResources(player, [0]);
            assert.equal(1, player.resources.wood);
            b.distributeResources(player, [15]);
            assert.equal(1, player.resources.brick);
            b.distributeResources(player, [4]);
            assert.equal(1, player.resources.wheat);
            b.distributeResources(player, [12]);
            assert.equal(1, player.resources.stone);
            b.distributeResources(player, [10]);
            assert.equal(1, player.resources.sheep);
        });

        it('should add 2 resources for a city.', function () {
            b.distributeResources(player, [0], true);
            assert.equal(2, player.resources.wood);
        });
    });

    describe('#rollDice', function () {
        it('should always be between 2 and 12 inclusive', function () {
            for (var i = 0; i < 1000; i++) {
                var value = b.rollDice();
                assert.ok(2 <= value);
                assert.ok(12 >= value);
            }
        });
    });
});
