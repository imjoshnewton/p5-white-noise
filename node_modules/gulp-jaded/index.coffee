map = require 'map-stream'
gutil = require 'gulp-util'
jaded = require 'jaded'

module.exports = (options) ->
  options = {} unless options

  modifyContents = (file, cb)->
    return cb null, file if file.isNull()
    return cb new Error "gulp-jaded: Streaming not supported" if file.isStream()

    file.contents = new Buffer jaded.compile file.contents.toString(), options
    file.path = gutil.replaceExtension file.path, '.js'

    cb null, file


  return map modifyContents
