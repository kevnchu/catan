module.exports = function (grunt) {
    grunt.initConfig({
        jshint: {
            all: ['app.js', 'app/*.js', 'public/js/*.js'],
            options: {
                curly: true,
                eqeqeq: true,
                immed: true,
                newcap: true,
                noarg: true,
                sub: true,
                undef: true,
                unused: true,
                boss: true,
                eqnull: true,
                browser: true,
                globals: {
                    require: true,
                    module: true,
                    describe: true,
                    it: true,
                    _: true,
                    $: true,
                    __dirname: true,
                    pubsubz: true
                },
                force: true
            },
        },
        mochaTest: {
            test: {
                options: {
                    reporter: 'spec'
                },
                src: ['test/**/*.js']
            }
        },
        browserify: {
            dist: {
                src: ['public/js/soc.js'],
                dest: 'public/bundle.js'
            }
        },
        exec: {
            run: {
                cmd: 'node app'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-exec');
    grunt.registerTask('default', ['jshint', 'mochaTest', 'browserify', 'exec']);
    grunt.registerTask('lint', ['jshint']);
    grunt.registerTask('test', ['mochaTest']);
    grunt.registerTask('build', ['browserify']);
};
