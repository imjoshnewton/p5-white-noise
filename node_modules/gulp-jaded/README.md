#gulp-jaded
[![Build Status](https://travis-ci.org/stevelacy/gulp-jaded.png?branch=master)](https://travis-ci.org/stevelacy/gulp-jaded)
[![NPM version](https://badge.fury.io/js/gulp-jaded.png)](http://badge.fury.io/js/gulp-jaded)

> Compile [Jaded](https://github.com/wearefractal/jade) with gulp

<table>
<tr> 
<td>Package</td><td>gulp-jaded</td>
</tr>
<tr>
<td>Description</td>
<td>Compile Jaded files with gulp (gulpjs.com)</td>
</tr>
<tr>
<td>Node Version</td>
<td>>= 0.9</td>
</tr>
<tr>
<td>Gulp Version</td>
<td>3.x</td>
</tr>
</table>

# Usage

## Install

```
npm install gulp-jaded --save
```
##Example


```javascript
var gulp = require('gulp');
var jaded = require('gulp-jaded');

gulp.task('task', function () {
  gulp.src('src/*.jade')
    .pipe(jaded())
    .pipe(gulp.dest('./build'));
});


gulp.task('default', function(){
  gulp.run('task');
});
```

####You can view more examples in the [example folder.](https://github.com/stevelacy/gulp-jaded/tree/master/examples)



## LICENSE

(MIT License)

Copyright (c) 2015 Steve Lacy <me@slacy.me> slacy.me

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
