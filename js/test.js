var EventEmitter = require('events').EventEmitter;
var util = require('util');
var test;
exports.Test = Test;

util.inherits(Test, EventEmitter);

function Test () {
    this.init();
}

Test.prototype = {
  init: function () {
      this.array = [];
      this.on('derp', function (data) {
          console.log("Emitted: " + data);
      });
  },

  push: function (x) {
      this.array.push(x);
  },

  each: function (fn) {
      var array = this.array;
      array.forEach(fn, this);
  }
};

if (require.main === module) {
    var tiles = [[110,0],[55,32.5],[0,65],[0,130],[0,195],[55,227.5],[110,260],
        [165,227.5],[220,195],[220,130],[220,65],[165,32.5],[110,65],[55,97.5],
        [55,162.5],[110,195],[165,162.5],[165,97.5],[110,130]
    ];
    var circles = [];
    var i;
    for (i = 0; i < 2; i++) {
        var x = tiles[i][0];
        var y = tiles[i][1];
        circles.push([x, y + 37.5]);
        circles.push([x + 19, y]);
        circles.push([x + 56, y]);
        circles.push([x + 75, y + 37.5]);
        circles.push([x + 19, y + 65]);
        circles.push([x + 56, y + 65]);
    }
    var uniq = {};
    for (i = 0 ; i < circles.length; i++) {
        var key = JSON.stringify(circles[i]);
        uniq[key] = 1;
    }

    var count = 0;
    for (var key in uniq) {
        if (uniq.hasOwnProperty(key)) {
            count++;
        }
    }
    console.log(circles);
}

/**
 *
 * var TestClass = require('./test').Test;
 */
