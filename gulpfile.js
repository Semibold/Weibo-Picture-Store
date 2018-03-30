/**
 * @file gulpfile
 */

const gulp = require("gulp");
const gulp_zip = require("gulp-zip");

gulp.task("deploy", function () {
  return gulp.src("source/**")
    .pipe(gulp_zip("bundle.zip"))
    .pipe(gulp.dest("deploy"))
});
