'use strict';
// Gulp.js configuration

// modules
import gulp from 'gulp';
import plumber from 'gulp-plumber';
import gulpif from 'gulp-if';
// Images
import newer from 'gulp-newer';
import imagemin from 'gulp-imagemin';
// Html
import htmlclean from 'gulp-htmlclean';
// Sass
import sass from 'gulp-sass';
import postcss from 'gulp-postcss';
import assets from 'postcss-assets';
import autoprefixer from 'autoprefixer';
import mqpacker from 'css-mqpacker';
import cssnano from 'cssnano';
import concatCss from 'gulp-concat-css';
// JS
import concat from 'gulp-concat';
import deporder from 'gulp-deporder';
import stripdebug from 'gulp-strip-debug';
import uglify from 'gulp-uglify';
import babel from 'gulp-babel';
import print from 'gulp-print';
import sourcemaps from 'gulp-sourcemaps';
import babelify from "babelify";
// TS
import merge from "merge2";
import browserify from "browserify";
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';
import tsify from "tsify";
import globby from 'globby';
// Server
import webserver from 'gulp-webserver';

// Folders
const folder = {
  src: './src/',
  dist: './dist/'
}
const babelConf = {
  presets: ["es2015-ie"],
  extensions: ['.ts']
};

const JSCompileList = [

];
const CSSCompileList = [
  `${folder.src}scss/styles.scss`
];


// Development state
const devBuild = (process.env.NODE_ENV !== 'production');


// Image processing
gulp.task('process:images', () => {
  const out = folder.dist + 'images/';
  return gulp.src(folder.src + 'images/**/*')
    .pipe(plumber())
    .pipe(newer(out))
    .pipe(imagemin({
      optimizationLevel: 5
    }))
    .pipe(gulp.dest(out));
});

// HTML processing
gulp.task('process:html', ['process:images'], () => {
  const out = folder.dist;
  let page = gulp.src(folder.src + 'html/**/*')
    .pipe(plumber())
    .pipe(newer(out));

  // minify production code
  if (!devBuild) {
    page = page.pipe(htmlclean());
  }

  return page.pipe(gulp.dest(out));
});



// JavaScript processing
// -Compiling
gulp.task("compile:ts", () => {

  globby(['./src/ts/**/*.ts']).then((entries) => {
    return browserify({
        basedir: '.',
        debug: true,
        entries: entries,
        cache: {},
        packageCache: {}
      })
      .plugin(tsify)
      .transform('babelify', {
        presets: ['es2015'],
        extensions: ['.ts']
      })
      .bundle()
      .pipe(plumber())
      .pipe(source('bundle.js'))
      .pipe(buffer())
      .pipe(gulpif(devBuild, (sourcemaps.init({
        loadMaps: true
      }))))
      .pipe(uglify())
      .pipe(gulpif(devBuild, sourcemaps.write("./")))
      .pipe(gulp.dest(`${folder.dist}/js`));
  });

});


// Resource managment
// -JS

// -Load stock assets
gulp.task('load:stockassets', () => {
  const out = folder.dist;
  let page = gulp.src(folder.src + 'stock/**/*')
    .pipe(plumber())
    .pipe(newer(out));

  return page.pipe(gulp.dest(out));
});

// - Fonts
gulp.task('load:fonts', () => {
  const out = folder.dist + '/fonts/';
  let page = gulp.src(folder.src + 'scss/resources/font-files/**/*')
    .pipe(plumber())
    .pipe(newer(out));

  return page.pipe(gulp.dest(out));
});


// SCSS processing
gulp.task('compile:scss', ['process:images'], () => {

  const postCssOpts = [
    assets({
      loadPaths: ['images/']
    }),
    autoprefixer({
      browsers: ['last 2 versions', '> 2%']
    }),
    mqpacker
  ];

  if (!devBuild) {
    postCssOpts.push(cssnano);
  }
  // Add in module's scss here if needed

  return gulp.src(CSSCompileList)
    .pipe(plumber())
    .pipe(sass({
      outputStyle: 'nested',
      imagePath: 'images/',
      precision: 3,
      errLogToConsole: true
    }))
    .pipe(concatCss("styles.css"))
    .pipe(postcss(postCssOpts))
    .pipe(gulp.dest(folder.dist + 'css/'));
});

// Build Tools
// TODO: Remove pending import module test
//gulp.task('build:js', ['compile:ts']);

// Run all tasks
gulp.task('run', ['process:html', 'load:stockassets', 'load:fonts', 'compile:scss', 'compile:ts']);

// Serve
gulp.task('serve', ['run'], function () {
  gulp.src('dist')
    .pipe(webserver({
      livereload: true,
      open: true
    }));
});

// Watch for changes
gulp.task('watch', () => {

  // Image changes
  gulp.watch(folder.src + 'images/**/*', ['process:images']);

  // Html changes
  gulp.watch(folder.src + 'html/**/*', ['process:html']);

  // Javascript changes
  gulp.watch(folder.src + 'ts/**/*', ['compile:ts']);

  // Css changes
  gulp.watch(folder.src + 'scss/**/*', ['compile:scss']);

});

// Default task
gulp.task('default', ['serve', 'watch']);