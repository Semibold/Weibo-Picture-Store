/**
 * Gulp
 */
const gulp = require("gulp");
const gulpZip = require("gulp-zip");


gulp.task("deploy", () => {
    return gulp
        .src("./source/**")
        .pipe(gulpZip("weibo-picture-store.zip"))
        .pipe(gulp.dest("./deploy/"));
});
