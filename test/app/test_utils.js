var utils = require('../../app/utils.js');
var assert = require('assert');

describe('utils', function () {

    describe('#getIntersectionId', function () {
        it('should sort the input location and convert to a string', function () {
            var location = [1,2,3];
            var result = utils.getIntersectionId(location);
            assert.equal('1,2,3', result);

            location = [2,3,1];
            result = utils.getIntersectionId(location);
            assert.equal('1,2,3', result);
        });
    });
});
