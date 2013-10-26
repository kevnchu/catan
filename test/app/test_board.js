var Board = require('../../app/board.js'),
    Roads = require('../../app/roads.js'),
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
            // FIXME
        });
    });

    describe('#isValidSettlement', function () {
        var player;
        beforeEach(function () {
            // mock player
            player = {
                id: 'test',
                name: 'test',
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
            settlement = b.isIntersection(intersectionId);
            assert.ok(!settlement);

            intersectionId = '1,12,13';
            settlement = b.isIntersection(intersectionId);
            assert.ok(settlement);
        });

        it('should check that intersection is not within 2 roads of an existing settlement.', function () {
            b.settlements = [{
                intersectionId: '1,12,13'
            }];
            var intersectionId = '1,12,13';
            var isOccupied = b.isIntersectionOccupied(intersectionId);
            assert.ok(isOccupied);

            b.settlements = [{
                intersectionId: '0,1,12'
            }];
            isOccupied = b.isIntersectionOccupied(intersectionId);
            assert.ok(isOccupied);

            b.settlements = [{
                intersectionId: '2,3,13'
            }];
            isOccupied = b.isIntersectionOccupied(intersectionId);
            assert.ok(!isOccupied);
        });

        it('should check that intersection is connected to a road', function () {
            var roads = b.roads;
            roads.roads = [{
                playerId: player.id,
                edge: ['5,14,15','5,6,15']
            }];
            var intersectionId = '1,12,13';
            var test = b.hasConnectedRoad(player.id, intersectionId);
            assert.ok(!test);

            roads.roads = [{
                playerId: player.id,
                edge: ['1,12,13', '0,1,12']
            }];
            intersectionId = '1,12,13';
            test = b.hasConnectedRoad(player.id, intersectionId);
            assert.ok(test);

            roads.roads = [{
                playerId: player.id,
                edge: ['0,1,12','1,12,13']
            }];
            intersectionId = '1,12,13';
            test = b.hasConnectedRoad(player.id, intersectionId);
            assert.ok(test);
        });
    });

    describe('#initResourceLocations', function () {
        it('each tile should map to a resource', function () {
            var resourceMap = b.initResourceLocations();
            var tileIds = Object.keys(resourceMap);
            assert.equal(tileIds.length, 19);
            var resources = {
                'wood': 0,
                'stone': 0,
                'brick': 0,
                'wheat': 0,
                'sheep': 0,
                'desert': 0
            };
            var tileId;
            var resource;
            for (tileId in resourceMap) {
                if (resourceMap.hasOwnProperty(tileId)) {
                    resource = resourceMap[tileId].type;
                    assert(resource in resources);
                    resources[resource]++;
                }
            }
            assert.equal(resources.wood, 4, 'should b 4 wood tiles');
            assert.equal(resources.sheep, 4, 'should b 4 sheep tiles');
            assert.equal(resources.wheat, 4, 'should b 4 wheat tiles');
            assert.equal(resources.brick, 3, 'should b 3 brick tiles');
            assert.equal(resources.stone, 3, 'should be 3 stone tiles');
            assert.equal(resources.desert, 1, 'should be one desert tile');
        });
    });

    describe('#initResourceValues', function () {
        it('should map dice values to tile ids.', function () {
            var resourceMap = {
                '0': { type: 'brick' },
                '1': { type: 'wheat' },
                '2': { type: 'sheep' },
                '3': { type: 'stone' },
                '4': { type: 'wheat' },
                '5': { type: 'wood' },
                '6': { type: 'wood' },
                '7': { type: 'sheep' },
                '8': { type: 'brick' },
                '9': { type: 'wood' },
                '10': { type: 'stone' },
                '11': { type: 'sheep' },
                '12': { type: 'brick' },
                '13': { type: 'sheep' },
                '14': { type: 'wheat' },
                '15': { type: 'stone' },
                '16': { type: 'wheat' },
                '17': { type: 'desert', value: 7 },
                '18': { type: 'wood' }
            };
            var diceMap = b.initResourceValues(resourceMap);
            assert(diceMap[2].length, 1, 'only one tile has a value of 2');
            assert(diceMap[12].length, 1, 'only one tile has a value of 12');
            assert(diceMap[3].length, 2);
            assert(diceMap[4].length, 2);
            assert(diceMap[5].length, 2);
            assert(diceMap[6].length, 2);
            assert(diceMap[8].length, 2);
            assert(diceMap[9].length, 2);
            assert(diceMap[10].length, 2);
            assert(diceMap[11].length, 2);
            assert.ok(diceMap);
        });
    });

    describe('#distributeResources', function () {
        var player;
        beforeEach(function () {
            player = {
                id: 'test',
                name: 'test',
                resources: {
                    wood: 0,
                    wheat: 0,
                    brick: 0,
                    stone: 0,
                    sheep: 0
                },
                socket: {
                    emit: sinon.stub()
                }
            };
            b.players.addPlayer(player);
            b.diceMap = {
                1: [],
                2: [],
                3: [],
                4: [],
                5: [],
                6: [],
                7: [],
                8: [],
                9: [],
                10: [],
                11: [],
                12: []
            };
            b.resourceMap = {
                '0': { type: 'brick' },
                '1': { type: 'wheat' },
                '2': { type: 'sheep' },
                '3': { type: 'stone' },
                '4': { type: 'wheat' },
                '5': { type: 'wood' },
                '6': { type: 'wood' },
                '7': { type: 'sheep' },
                '8': { type: 'brick' },
                '9': { type: 'wood' },
                '10': { type: 'stone' },
                '11': { type: 'sheep' },
                '12': { type: 'brick' },
                '13': { type: 'sheep' },
                '14': { type: 'wheat' },
                '15': { type: 'stone' },
                '16': { type: 'wheat' },
                '17': { type: 'desert', value: 7 },
                '18': { type: 'wood' }
            };
        });
        it('should add one to the corresponding resource type.', function () {
            /*
            FIXME
            b.settlements.settlements = [{
                intersectionId: '1,12,13',
                playerId: player.id
            }];
            b.distributeResources({}, 1);
            assert.equal(1, player.resources.wheat);
            b.distributeResources({}, 10);
            assert.equal(0, player.resources.stone);
            b.distributeResources({}, 12);
            assert.equal(1, player.resources.brick);
            */
        });

        it('should notify players when they recieve new resources.', function () {
            // TODO
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
