exports.Road = Road;

function Road(p1, p2, playerId) {
    this.playerId = playerId;
    this.edge = [p1, p2];
}

Road.prototype = {
    includes: function (p) {
        return this.edge.indexOf(p) >= 0;
    }
};


//class Road
//  attr_accessor :player_id, :edge
//
//  def initialize p1, p2, player_id
//    @player_id = player_id
//    @edge = [p1,p2]
//  end
//
//  def include? p
//    @edge.include? p
//  end
//end
