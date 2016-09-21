/**
 *
 *  Purity: PureCSS for Grav
 *  by Lawrence Meckan
 */

'use strict';

// Include Gulp & Tools We'll Use
var gulp = require('gulp');
var fs = require('fs');
var merge = require('merge-stream');
var $ = require('gulp-load-plugins')();
var del = require('del');
var vinylPaths = require('vinyl-paths');
var runSequence = require('run-sequence');
var browserSync = require('browser-sync');
var codeFiles = '';
var reload = browserSync.reload;
var path = require('path');
var pkg = require('./package.json');
var through = require('through2');
var autoprefixer = require('autoprefixer');
var grids = require('rework-pure-grids');
var prefixer = require('gulp-prefix-css');


const AUTOPREFIXER_BROWSERS = [
  'ie >= 10',
  'ie_mob >= 10',
  'ff >= 30',
  'chrome >= 34',
  'safari >= 7',
  'opera >= 23',
  'ios >= 7',
  'android >= 4.4',
  'bb >= 10'
];

var cssFolders = [
  'scss/pure/src/base/css/*.css', 
  'scss/pure/src/buttons/css/*.css',
  'scss/pure/src/forms/css/*.css',
  'scss/pure/src/grids/css/*.css',
  'scss/pure/src/menus/css/*.css',
  'scss/pure/src/tables/css/*.css'
];

var pureUnits = [5, 7, 24];


// ***** Development tasks ****** //

// Copy patches
gulp.task('patch:grid', function() {
  return gulp.src(['js/rework/**/*']).pipe(gulp.dest('node_modules/rework-pure-grids'));
});

gulp.task('patch:sass', function() {
  return gulp.src(['scss/patch/**/*']).pipe(gulp.dest('scss/pure/src/'));
});

// Lint CSS
gulp.task('csslint', function() {
  gulp.src(cssFolders)
    .pipe($.csslint('scss/pure/.csslintrc'))
    .pipe($.csslint.formatter());
});

// Prefix base pure CSS
gulp.task('prefix', function() {
  return gulp.src('scss/pure/src/base/css/base.css')
    .pipe(prefixer('.pure'))
    .pipe(gulp.dest('build/base/'));
});


// Grids tasks
gulp.task('grids:default', function() {
  return gulp.src('scss/grids-units.css')
    .pipe($.rework(grids.units(pureUnits))).
    pipe(gulp.dest('build/grids'));
});

gulp.task('grids:responsive', function() {
  return gulp.src('scss/grids-responsive.css')
    .pipe($.rework(grids.units(pureUnits,{
      mediaQueries: {
                    sm: 'screen and (min-width: 35.5em)',   // 568px
                    md: 'screen and (min-width: 48em)',     // 768px
                    lg: 'screen and (min-width: 64em)',     // 1024px
                    xl: 'screen and (min-width: 80em)'      // 1280px
    }
  }))).pipe(gulp.dest('build/grids'));
});

// PostCSS
gulp.task('postcss', function () {
    var processors = [
        autoprefixer({browsers: ['last 2 versions', 'ie >= 8', 'iOS >= 6', 'Android >= 4']}),
    ];
    return gulp.src('build/**/*.css')
        .pipe($.postcss(processors))
        .pipe(gulp.dest('build'));
});

// Lint JavaScript
gulp.task('jshint', function() {
  return gulp.src(['js/**/*.js' , 'gulpfile.js'])
    .pipe(reload({stream: true, once: true}))
    .pipe($.jshint())
    .pipe($.jshint.reporter('jshint-stylish'))
    .pipe($.if(!browserSync.active, $.jshint.reporter('fail')));
});

// Lint JavaScript code style
gulp.task('jscs', function() {
  return gulp.src(['js/**/*.js' , 'gulpfile.js'])
    .pipe(reload({stream: true, once: true}))
    .pipe($.jscs())
    .pipe($.jscs.reporter())
    .pipe($.if(!browserSync.active, $.jshint.reporter('fail')));
});

// Compile and Automatically Prefix Stylesheets (production)
gulp.task('styles', function() {
  // For best performance, don't add Sass partials to `gulp.src`
  return gulp.src([
    'scss/pure.scss'
  ])
     // Generate Source Maps
    .pipe($.sourcemaps.init())
    .pipe($.sass({
      precision: 10,
      onError: console.error.bind(console, 'Sass error:')
    }))
    .pipe($.cssInlineImages({
      webRoot: ''
    }))
    .pipe($.autoprefixer(AUTOPREFIXER_BROWSERS))
    .pipe(gulp.dest('.tmp'))
    // Concatenate Styles
    .pipe($.concat('pure.css'))
    .pipe(gulp.dest('./css'))
    // Minify Styles
    .pipe($.if('*.css', $.csso()))
    .pipe($.concat('pure.min.css'))
    .pipe($.sourcemaps.write('./'))
    .pipe(gulp.dest('./css'))
    .pipe($.size({title: 'styles'}));
});


// Clean Output Directory
gulp.task('clean', del.bind(null, ['build', '.publish'], {dot: true}));

// Copy package manger and LICENSE files to dist
gulp.task('metadata', function() {
  return gulp.src(['package.json', 'bower.json', 'LICENSE'])
    .pipe(gulp.dest('./dist'));
});

// Build Production Files, the Default Task
gulp.task('default', ['clean'], function(cb) {
  runSequence(
    ['development'],
    ['styles'],
    cb);
});

// Patch tasks
gulp.task('patch', function(cb) {
  runSequence(
    ['patch:sass', 'patch:grid'],
    cb);
});

// Grids tasks
gulp.task('grids', function(cb) {
  runSequence(
    ['grids:default', 'grids:responsive'],
    cb);
});


// Build Development Tasks
gulp.task('development', ['clean'], function(cb) {
  runSequence(
    ['patch'],
    ['csslint'],
    ['prefix'],
    ['grids'],
    ['postcss'],
    cb);
});

/**
 * Defines the list of resources to watch for changes.
 */
function watch() {
  gulp.watch(['scss/**/*.{scss,css}'],
    ['styles', reload]);
}

