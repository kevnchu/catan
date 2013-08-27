exports.Roads = Roads;
function Roads() {
    this.roads = [];
}

Roads.prototype = {
    init: function () {
    },

    addRoad: function (road) {
        this.roads.push(road);
    },

    longestPath: function () {
    },

    byPlayerId: function (playerId) {
        return this.roads.filter(function (x) {
            return x.playerId === playerId;
        });
    },

    each: function (fn) {
        var roads = this.roads,
            i;
        for (i = 0; i < roads.length; i++)
            fn(roads[i]);
    }
};
//class Roads
//
//  attr_reader :roads
//
//  def initialize
//    @roads = {}
//  end
//
//  def add_road edge, player_id
//    k1 = get_location_id edge[0]
//    k2 = get_location_id edge[1]
//    if not @roads[player_id]
//      roads = @roads[player_id] = {}
//    end
//    roads = @roads[player_id]
//    add_node k1, k2, roads
//    add_node k2, k1, roads
//  end
//
//  def longest_path player_id
//    roads = @roads[player_id]
//  end
//
//  def get_roads_by_player player_id
//  end
//
//  # iterate through all roads.
//  def each &b
//    @roads.each { |player_id, roads|
//      roads.each &b
//    }
//  end
//
//  private
//  def add_node key, value, hash
//    if not hash[key]
//      hash[key] = []
//    end
//    hash[key].push value
//  end
//
//end
