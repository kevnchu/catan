define(function () {
    var Road = Backbone.Model;

    var Roads = Backbone.Collection.extend({
        model: Road,

        byPlayerId: function (id) {
            return this.where({
                playerId: id
            });
        }
    });

    // Create our global collection of **Todos**.
    var roads = new Roads();

    return {
        model: Road,
        collection: Roads
    };
});
