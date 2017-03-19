let gulp = require('gulp');
let zip = require('gulp-zip');

gulp.task('deploy', () => {
    return gulp
        .src('./source/**')
        .pipe(zip('weibo-picture-store.zip'))
        .pipe(gulp.dest('./deploy/'));
});
