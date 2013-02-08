var utils = require('../utils.js');
var assert = require('assert');

describe('utils', function () {

    describe('#getLocationId', function () {
        it('should sort the input location and convert to a string', function () {
            var location = [1,2,3];
            var result = utils.getLocationId(location);
            assert.equal('123', result);

            location = [2,3,1];
            result = utils.getLocationId(location);
            assert.equal('123', result);
        });
    });
});
