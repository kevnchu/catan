var Board = require('../../app/board.js').Board,
    assert = require('assert'),
    sinon = require('sinon'),
    Q = require('q');

describe('Board', function () {
    var b;
    beforeEach(function () {
        b = new Board();
    });

    describe('#setup', function () {
        it('should let each player select their starting positions.', function () {
            var setup = b.setup.bind(b);
            var promise = Q.defer().promise;
            b.chooseSettlement = sinon.stub().returns(promise);
            setup();
            assert(b.chooseSettlement.called);
        });
    });

    describe('#adduser', function () {
        it('should call initialize when the game is full', function () {
            b.players.addPlayer = sinon.stub();
            b.initialize = sinon.spy();
            // XXX this needs to be updated once we allow 3/4 players.
            b.players.count = sinon.stub().returns(2);
            b.addUser({});
            assert(b.initialize.called);
        });
    });

    describe('#isValidSettlement', function () {
        var player;
        beforeEach(function () {
            // mock player
            player = {
                id: 'test',
                name: 'test',
                settlements: [],
                roads: [{
                    edge: ['1,12,13', '0,1,12']
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
        it('should check to see if intersection is valid', function () {
            var intersectionId;
            var settlement;
            intersectionId = '1,14,5';
            settlement = b.isValidSettlement(player, intersectionId);
            assert.ok(!settlement);

            intersectionId = '1,12,13';
            settlement = b.isValidSettlement(player, intersectionId);
            assert.ok(settlement);
        });

        it('should check that intersection is not within 2 roads of an existing settlement.', function () {
            b.settlements = [{
                intersectionId: '1,12,13'
            }];
            var intersectionId = '1,12,13';
            var settlement = b.isValidSettlement(player, intersectionId);
            assert.ok(!settlement);

            b.settlements = [{
                intersectionId: '0,1,12'
            }];
            settlement = b.isValidSettlement(player, intersectionId);
            assert.ok(!settlement);
        });

        it('should check that intersection is connected to a road', function () {
            player.roads = [{
                edge: ['5,14,15','5,6,15']
            }];
            var intersectionId = '1,12,13';
            var settlement = b.isValidSettlement(player, intersectionId);
            assert.ok(!settlement);

            player.roads = [{
                edge: ['1,12,13', '0,1,12']
            }];
            intersectionId = '1,12,13';
            settlement = b.isValidSettlement(player, intersectionId);
            assert.ok(settlement);

            player.roads = [{
                edge: ['0,1,12','1,12,13']
            }];
            intersectionId = '1,12,13';
            settlement = b.isValidSettlement(player, intersectionId);
            assert.ok(settlement);
        });
    });

    describe('#initResourceLocations', function () {
        it('should create a resources object', function () {
            //assert.doesNotThrow(b.initResourceLocations);
            var resourceMap = b.initResourceLocations();
            assert.ok(resourceMap);
        });
    });

    describe('#initResourceValues', function () {
        it('should create a dice values object', function () {
            //assert.doesNotThrow(b.initResourceValues);
            var resourceMap = b.initResourceLocations();
            var diceMap = b.initResourceValues(resourceMap);
            assert.ok(diceMap);
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

        it('should notify players when they recieve new resources.', function () {
            // TODO
            assert(false);
        });
    });

    describe('#rollDice', function () {
        it('should always roll an integer between 2 and 12 inclusive', function () {
            for (var i = 0; i < 1000; i++) {
                var value = b.rollDice();
                assert.ok(2 <= value);
                assert.ok(12 >= value);
                assert.ok((value % 1) === 0);
            }
        });
    });
});
