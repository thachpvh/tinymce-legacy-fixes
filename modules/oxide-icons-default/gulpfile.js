var iconPackager = require('@ephox/oxide-icons-tools').iconPackager;
var clean = require('gulp-clean');
var fs = require('fs');
var gulp = require('gulp');
var path = require('path');

var findSvgs = function (dir) {
  return fs.readdirSync(dir).reduce(function (svgs, name) {
    var filePath = path.join(dir, name);
    var stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      return svgs.concat(findSvgs(filePath));
    }

    return /\.svg$/.test(name) ? svgs.concat(filePath) : svgs;
  }, []);
};

gulp.task('icon-packager', function () {
  return iconPackager({
    name: 'default',
    filePaths: findSvgs('src/svg')
  });
});

gulp.task('clean', function () {
  return gulp.src('./dist', {
    read: false,
    allowEmpty: true,
  }).pipe(clean());
});

gulp.task('default', gulp.series('clean', 'icon-packager'));
