require(['resources'], function (Resources) {
    describe('Resources', function () {
        var resources;
        beforeEach(function () {
            resources = new Resources();
        });

        describe('add', function () {
            it('should add a given resource type and quantity.', function () {
                resources.add('wood', 2);
                assert.equal(2, resources.get('wood'));
            });
        });
    });
});
