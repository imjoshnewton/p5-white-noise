should = require 'should'
jaded = require '../'
gutil = require 'gulp-util'
fs = require 'fs'

require 'mocha'

describe 'gulp-jaded', ->
  it 'should render jaded .jade files to javascript .js', (done) ->
    J = jaded()
    fakeFile = new gutil.File
      base: 'test/fixtures'
      cwd: 'test/'
      path: 'test/fixtures/normal.jade'
      contents: fs.readFileSync 'test/fixtures/normal.jade'

    J.once 'data', (newFile) ->
      should.exist newFile
      should.exist newFile.contents
      String(newFile.contents).should.equal fs.readFileSync 'test/expected/normal.js', 'utf8'
      done()

    J.write fakeFile
