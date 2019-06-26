////////////////////////////////////////////////////////////////////////////////
//
//  gulpfile.js: Basic SCSS, HTML and JS build
//
////////////////////////////////////////////////////////////////////////////////

var gulp = require('gulp');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var browserSync = require('browser-sync').create();
var useref = require('gulp-useref');
var uglify = require('gulp-uglify');
var gulpIf = require('gulp-if');
var gutil = require('gulp-util');
var imagemin = require('gulp-imagemin');
var pipeline = require('readable-stream').pipeline;
var del = require('del');

gulp.task('clean', function(cb) {
  return del(['docs/*']);
});

gulp.task('sass', function () {
  return gulp.src('styles/*.scss')
        .pipe(sass({
          outputStyle: 'compressed'
        })).on('error', gutil.log)
        .pipe(autoprefixer()).on('error', gutil.log)
        .pipe(gulp.dest('docs/styles')).on('error', gutil.log)
        .pipe(browserSync.reload({
          stream: true
        }))
});

gulp.task('useref', function () {
  return gulp.src('*.html')
    /*.pipe(useref())*/
    /*.pipe(gulpIf('*.js', uglify())).on('error', gutil.log)*/
    .pipe(gulp.dest('docs')).on('error', gutil.log)
    .pipe(browserSync.reload({
      stream: true
    }));
});

gulp.task('compress', function () {
  return pipeline(
        gulp.src('js/*.js'),
        uglify(),
        gulp.dest('docs/js')
  );
});

gulp.task('libraries', function () {
  return pipeline(
    gulp.src('libraries/*.js'),
    gulp.dest('docs/libraries')
  );
});

gulp.task('images', function (){
  return gulp.src('**/*.+(png|jpg|gif|svg)')
  .pipe(imagemin())
  .pipe(gulp.dest('docs'))
});

gulp.task('audio', function () {
  return gulp.src('audio/*.mp3')
    .pipe(gulp.dest('docs/audio')).on('error', gutil.log)
    .pipe(browserSync.reload({
      stream: true
    }));
});

gulp.task('browserSync', function () {
  browserSync.init({
    server: {
      baseDir: 'docs'
    },
    browser: "google chrome"
  });
});

gulp.task('reload', function () {
  return browserSync.reload({
    stream: true
  });
});

gulp.task('default', gulp.series('clean', gulp.parallel('sass', 'useref', 'libraries', 'compress', 'audio'), 'browserSync', function a() {
  gulp.watch('./styles/**/*.scss', gulp.series('sass', 'reload')),
  gulp.watch('./*.html', gulp.series('useref', 'reload')),
  gulp.watch('./js/**/*.js', gulp.series('compress', 'reload', function () {console.log('ran js watch.')})),
  gulp.watch('./audio/*.mp3', gulp.series('audio', 'reload'));
  return
}));

gulp.task('server', gulp.series('clean', gulp.parallel('sass', 'useref', 'libraries', 'compress', 'audio', 'images')), function b() {
  gulp.watch('styles/**/*.scss', gulp.series('sass'));
  gulp.watch('*.html', gulp.series('useref'));
  gulp.watch('js/**/*.js', gulp.series('compress'));
  gulp.watch('audio/*.mp3', gulp.series('audio'));
});

gulp.task('build', gulp.series('clean', gulp.parallel('sass', 'useref', 'libraries', 'compress', 'audio')));
