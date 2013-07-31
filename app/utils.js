exports.getLocationId = function (location) {
    return location.sort().join('');
};
