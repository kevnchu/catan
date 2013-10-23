module.exports = {
    template: function (templateStr, data) {
        var parser = new DOMParser(),
            dummy = document.createElement('div');
        dummy.innerHTML = templateStr.replace(/{{[a-zA-Z0-9]*}}/g, function (match, offset, str) {
            match = match.substring(2, match.length - 2).split('.');
            return match.reduce(function (prev, curr) {
                return prev[curr];
            }, data);
        }, 'g');
        return dummy.firstChild;
    },

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
