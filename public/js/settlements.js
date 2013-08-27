define(['utils'], function (utils) {
    var Settlement = Backbone.Model;

    var Settlements = Backbone.Collection.extend({
        model: Settlement,

        byPlayerId: function (id) {
            return this.where({
                playerId: id
            });
        }
    });

    return {
        model: Settlement,
        collection: Settlements
    };
});
