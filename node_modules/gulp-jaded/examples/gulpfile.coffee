gulp = require 'gulp'
jaded = require '../'

gulp.task 'task', ->
  gulp.src('src/*.jade')
  .pipe(jaded())
  .pipe gulp.dest './build'


gulp.task 'default', ->
  gulp.run 'task'