module.exports = {

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
    },

    createUniqueId: function () {
        var idstr = String.fromCharCode(Math.floor((Math.random() * 25) + 65)),
            asciicode;
        do {                
            asciicode = Math.floor((Math.random() * 42) + 48);
            if (asciicode < 58 || asciicode > 64){
                idstr += String.fromCharCode(asciicode);    
            }                
        } while (idstr.length < 32);

        return idstr;
    }
};
