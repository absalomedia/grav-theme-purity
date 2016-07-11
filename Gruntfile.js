module.exports = function (grunt) {

// -- Config -------------------------------------------------------------------

grunt.initConfig({

    nick : 'pure',
    pkg  : grunt.file.readJSON('package.json'),


    // -- Clean Config ---------------------------------------------------------

    clean: {
        build    : ['build/'],
        build_res: ['build/*-r.css'],
        release  : ['release/<%= pkg.version %>/']
    },


    // -- CSSLint Config -------------------------------------------------------

    csslint: {
        options: {
            csslintrc: 'scss/pure/.csslintrc'
        },

        base   : ['scss/pure/src/base/css/*.css'],
        buttons: ['scss/pure/src/buttons/css/*.css'],
        forms  : ['scss/pure/src/forms/css/*.css'],
        grids  : ['scss/pure/src/grids/css/*.css'],
        menus  : ['scss/pure/src/menus/css/*.css'],
        tables : ['scss/pure/src/tables/css/*.css']
    },

    // -- Copy Patch Config --------------------------------------------------------
    copy: {
        jspatch: {
            expand: true,
            cwd: 'js/rework/',
            src: '**',
            dest: 'node_modules/rework-pure-grids',
          },
        csspatch: {
            expand: true,
            cwd: 'scss/patch/',
            src: '**',
            dest: 'scss/pure/src/',
        },
    },

    // -- PostCSS Config --------------------------------------------------------

    postcss: {
        options: {
            processors: [
                require('autoprefixer')({browsers: ['last 2 versions', 'ie >= 8', 'iOS >= 6', 'Android >= 4']})
            ]
        },
        dist: {
            src: 'build/*.css'
        }
    },


    // -- Pure Grids Units Config ----------------------------------------------

    pure_grids: {
        default_units: {
            dest: 'build/grids/grids-units.css',

            options: {
                units: [5, 7, 24]
            }
        },

        responsive: {
            dest: 'build/grids/grids-responsive.css',

            options: {
                mediaQueries: {
                    sm: 'screen and (min-width: 35.5em)',   // 568px
                    md: 'screen and (min-width: 48em)',     // 768px
                    lg: 'screen and (min-width: 64em)',     // 1024px
                    xl: 'screen and (min-width: 80em)'      // 1280px
                }
            }
        }
    },

    
    // -- CSS Selectors Config -------------------------------------------------

    css_selectors: {
        base: {
            src : 'scss/pure/src/base/css/base.css',
            dest: 'build/base/base.css',

            options: {
                mutations: [{prefix: '.pure'}]
            }
        }
    },

    // -- Watch/Observe Config -------------------------------------------------

    observe: {
        src: {
            files: 'scss/pure/src/**/css/*.css',
            tasks: ['test', 'suppress', 'grunt-build'],

            options: {
                interrupt: true
            }
        }
    }
});

// -- Main Tasks ---------------------------------------------------------------

// npm tasks.
grunt.loadNpmTasks('grunt-contrib-clean');
grunt.loadNpmTasks('grunt-contrib-copy');
grunt.loadNpmTasks('grunt-contrib-concat');
grunt.loadNpmTasks('grunt-contrib-csslint');
grunt.loadNpmTasks('grunt-contrib-cssmin');
grunt.loadNpmTasks('grunt-contrib-compress');
grunt.loadNpmTasks('grunt-contrib-watch');
grunt.loadNpmTasks('grunt-css-selectors');
grunt.loadNpmTasks('grunt-postcss');
grunt.loadNpmTasks('grunt-pure-grids');

// Local tasks.
grunt.loadTasks('/tasks');

grunt.registerTask('default', ['test', 'grunt-build']);
grunt.registerTask('test', ['csslint']);
grunt.registerTask('grunt-build', [
    'copy:jspatch',
    'copy:csspatch',
    'pure_grids',
    'css_selectors:base',
    'postcss',
]);

// Makes the `watch` task run a build first.
grunt.renameTask('watch', 'observe');
grunt.registerTask('watch', ['default', 'observe']);

grunt.registerTask('release', [
    'default',
    'clean:release',
    'copy:release',
    'compress:release'
]);

};
