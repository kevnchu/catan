define({
    getIntersectionId: function (intersection) {
        return intersection.slice().sort(function (a, b) {
            return a - b;
        }).join();
    },

    getTileIdsFromIntersectionId: function (intersectionId) {
        return intersectionId.split(',').map(function (x) {
            return +x;
        });
    },

    shuffleArray: function (array) {
        var clonedArray = array.slice(0);
        var shuffledArray = [];
        while (clonedArray.length) {
            shuffledArray.push(clonedArray.splice(Math.floor(Math.random() * clonedArray.length), 1)[0]);
        }
        return shuffledArray;
    }
});
