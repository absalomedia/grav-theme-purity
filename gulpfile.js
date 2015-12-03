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
var uniffe = require('./utils/uniffe.js');
var del = require('del');
var vinylPaths = require('vinyl-paths');
var runSequence = require('run-sequence');
var browserSync = require('browser-sync');
var codeFiles = '';
var reload = browserSync.reload;
var path = require('path');
var pkg = require('./package.json');
var through = require('through2');
var swig = require('swig');

var AUTOPREFIXER_BROWSERS = [
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

// ***** Development tasks ****** //

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
gulp.task('clean', del.bind(null, ['dist', '.publish'], {dot: true}));

// Copy package manger and LICENSE files to dist
gulp.task('metadata', function() {
  return gulp.src(['package.json', 'bower.json', 'LICENSE'])
    .pipe(gulp.dest('./dist'));
});

// Build Production Files, the Default Task
gulp.task('default', ['clean'], function(cb) {
  runSequence(
    ['styles'],
    cb);
});


// ***** Landing page tasks ***** //

/**
 * Site metadata for use with templates.
 * @type {Object}
 */
var site = {};

/**
 * Generates an HTML file based on a template and file metadata.
 */
function applyTemplate() {
  return through.obj(function(file, enc, cb) {
    var data = {
      site: site,
      page: file.page,
      content: file.contents.toString()
    };

    var templateFile = path.join(
        __dirname, 'docs', '_templates', file.page.layout + '.html');
    var tpl = swig.compileFile(templateFile, {cache: false});
    file.contents = new Buffer(tpl(data), 'utf8');
    this.push(file);
    cb();
  });
}


/**
 * Defines the list of resources to watch for changes.
 */
function watch() {
  gulp.watch(['scss/**/*.{scss,css}'],
    ['styles', 'styles-grid', 'styletemplates', reload]);
}

/**
 * Serves the landing page from "out" directory.
 */
gulp.task('serve:browsersync', function() {
  browserSync({
    notify: false,
    server: {
      baseDir: ['dist']
    }
  });

  watch();
});

gulp.task('serve', function() {
  $.connect.server({
    root: 'dist',
    port: 5000,
    livereload: true
  });

  watch();

  gulp.src('./dist/index.html')
    .pipe($.open('', {url: 'http://localhost:5000'}));
});

// Generate release archive containing just JS, CSS, Source Map deps
gulp.task('zip:pure', function() {
  return gulp.src(['dist/pure?(.min)@(.js|.css)?(.map)', 'LICENSE', 'bower.json', 'package.json'])
    .pipe($.zip('pure.zip'))
    .pipe(gulp.dest('dist'));
});

// Generate release archive containing the library, templates and assets
// for templates. Note that it is intentional for some templates to include
// a customised version of the material.min.css file for their own needs.
// Others (e.g the Android template) simply use the default built version of
// the library.

// Define a filter containing only the build assets we want to pluck from the
// `dist` stream. This enables us to preserve the correct final dir structure,
// which was not occurring when simply using `gulp.src` in `zip:templates`

var fileFilter = $.filter([
  'material?(.min)@(.js|.css)?(.map)',
  'templates/**/*.*',
  'assets/**/*.*',
  'LICENSE',
  'bower.json',
  'package.json']);

gulp.task('zip', ['zip:pure']);

gulp.task('genCodeFiles', function() {
  return gulp.src(['dist/pure.*@(js|css)?(.map)', 'dist/pure.zip', 'dist/mdl-templates.zip'],
      {read: false})
    .pipe($.tap(function(file, t) {
      codeFiles += ' dist/' + path.basename(file.path);
    }));
});