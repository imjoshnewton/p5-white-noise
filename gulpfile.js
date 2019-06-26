////////////////////////////////////////////////////////////////////////////////
//
//  gulpfile.js: Basic SCSS, HTML and JS build
//
////////////////////////////////////////////////////////////////////////////////

const { src, task, watch, dest, series, parallel } = require('gulp');

var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var browserSync = require('browser-sync').create();
var uglify = require('gulp-uglify');
var gulpIf = require('gulp-if');
var gutil = require('gulp-util');
var imagemin = require('gulp-imagemin');
var pipeline = require('readable-stream').pipeline;
var del = require('del');

function clean(cb) {
  return del(['docs/*']);
};

function css(cb) {
  return src('styles/*.scss')
        .pipe(sass({
          outputStyle: 'compressed'
        })).on('error', gutil.log)
        .pipe(autoprefixer()).on('error', gutil.log)
        .pipe(dest('docs/styles')).on('error', gutil.log)
        .pipe(browserSync.reload({
          stream: true
        }));
};

function html(cb) {
  return src('*.html')
    .pipe(dest('docs')).on('error', gutil.log)
    .pipe(browserSync.reload({
      stream: true
    }));
};

function scripts(cb) {
  return pipeline(
        src('js/*.js'),
        uglify(),
        dest('docs/js'),
        browserSync.reload({
          stream: true
        })
  );
};

function libraries(cb) {
  return pipeline(
    src('libraries/*.js'),
    dest('docs/libraries')
  );
};

function images(cb) {
  return src('**/*.+(png|jpg|gif|svg)')
  .pipe(imagemin())
  .pipe(dest('docs'));
};

function audio(cb) {
  return src('audio/*.mp3')
    .pipe(dest('docs/audio')).on('error', gutil.log)
    .pipe(browserSync.reload({
      stream: true
    }));
};

function browser_sync(cb) {
  browserSync.init({
    server: {
      baseDir: 'docs'
    },
    browser: "google chrome"
  });
  cb();
};

function reload(cb) {
  return browserSync.reload({
    stream: true
  });
};

function watch_files(cb) {
  watch('./styles/**/*.scss', css);
  watch('./*.html', html);
  watch('./js/**/*.js', scripts);
  cb();
}

exports.clean = clean;
exports.css = css;
exports.html = html;
exports.scripts = scripts;
exports.default = series(clean, parallel(css, html, libraries, scripts, audio), browser_sync, watch_files);
exports.build = series(clean, parallel(css, html, libraries, scripts, audio));
