define(function () {
    var Player = function (defaults) {
        this.model = new model(defaults);
        this.view = new view({model: this.model});
    };

    var model = Backbone.Model.extend({
        defaults: {
            resources: {
                'wood': 0,
                'wheat': 0,
                'sheep': 0,
                'stone': 0,
                'brick': 0
            },
            developmentCards: []
        },

        initialize: function () {
        },

        addResource: function (resource, quantity) {
            var resources = this.get('resources');
            resources[resource] += quantity;
            this.set('resources', resources);
            this.trigger('change');
        },

        removeResource: function (resource, quantity) {
            // error handling for negative quantities?
            this.addResource(resource, -quantity);
        },

        addDevCard: function (card) {
            var devCards = this.get('developmentCards');
            devCards.push(card);
            this.set('developmentCards', devCards);
            this.trigger('change');
        }
    });

    var view = Backbone.View.extend({
        el: $('#resources-container'),

        template: _.template($('#resources-template').html()),

        initialize: function () {
            this.render();
            this.listenTo(this.model, 'change', this.render);
        },

        render: function () {
            // render resources
            this.$el.html(this.template(this.model.attributes));

            // render dev cards.
        }
    });

    return Player;
});
