var longestPath = require('../../app/longest_path'),
    assert = require('assert'),
    sinon = require('sinon');

describe('longestPath', function () {
    it('should handle empty case', function () {
        var value = longestPath([]);
        assert.equal(0, value);
    });

    it('should count longest path', function () {
        var edges = [[5,6],[1,2],[2,3],[6,2],[4,3]]; // longest 5,6 -> 6,2 -> 2,3 -> 4,3
        assert.equal(4, longestPath(edges));

        edges = [[1,2],[2,3],[2,7],[2,8]];
        assert.equal(2, longestPath(edges));

        edges = [[1,2],[2,3],[2,7],[2,8],[8,9]];
        assert.equal(3, longestPath(edges));

        edges = [[1,2],[2,3],[2,7],[2,8],[8,9],[3,4]];
        assert.equal(3, longestPath(edges));

        edges = [[1,2],[2,3],[2,7],[2,8],[10,11],[11,12],[12,13],[13,14],[14,15]];
        assert.equal(5, longestPath(edges));

        edges = [[10,11],[2,3],[2,7],[2,8],[1,2],[11,12],[12,13],[13,14],[14,15]];
        assert.equal(5, longestPath(edges));

        edges = [[1,2],[2,3]];
        assert.equal(2, longestPath(edges));

        edges = [[1, 2], [3, 4], [5, 3]];
        assert.equal(2, longestPath(edges));
    });

    it('should handle cycles', function () {
        var edges = [[1,2], [2, 3], [7,5], [2,7], [5,1]];
        assert.equal(5, longestPath(edges));

        edges = [[1,2],[2,3],[3,8],[8,7],[2,7],[7,5],[5,1]];
        assert.equal(6, longestPath(edges));

        edges = [[1,2], [2, 3], [3,4], [4,5], [5,6], [6,1]];
        assert.equal(6, longestPath(edges));
    });

    it('should handle isolated edges', function () {
        var edges = [[1,2],[3,4],[5,6]];
        assert.equal(1, longestPath(edges));
    });
});
