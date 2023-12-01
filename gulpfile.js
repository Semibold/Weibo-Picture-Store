const gulp = require("gulp");
const gulp_zip = require("gulp-zip");
const gulp_rename = require('gulp-rename');
const gulp_json_modify = require("gulp-json-modify");
const merge_stream = require("merge-stream");
const pkg = require("./package.json");

gulp.task("bundle:chrome", () => {
    const others = gulp.src(["src/**", "!src/manifest.json", "!src/manifest.firefox.json", "!src/**/*.ts", "!src/**/*.js.map"]);
    const manifest = gulp.src("src/manifest.json").pipe(
        gulp_json_modify({
            key: "version",
            value: pkg.version,
        }),
    );

    return merge_stream(manifest, others)
        .pipe(gulp_zip("bundle.zip"))
        .pipe(gulp.dest("dist/chrome"));
});

gulp.task("bundle:firefox", () => {
    const others = gulp.src(["src/**", "!src/manifest.json", "!src/manifest.firefox.json", "!src/**/*.ts", "!src/**/*.js.map"]);
    const manifest = gulp
        .src("src/manifest.firefox.json")
        .pipe(
            gulp_json_modify({
                key: "version",
                value: pkg.version,
            }),
        )
        .pipe(gulp_rename('manifest.json'));

    return merge_stream(manifest, others)
        .pipe(gulp_zip("bundle.zip"))
        .pipe(gulp.dest("dist/firefox"));
});

/**
 * Task for CI/CD
 * Use git to revert changes if call it locally
 */
gulp.task('apply:manifest:firefox', () => {
    return gulp
        .src("src/manifest.firefox.json")
        .pipe(gulp_rename('manifest.json'))
        .pipe(gulp.dest("src"))
});
