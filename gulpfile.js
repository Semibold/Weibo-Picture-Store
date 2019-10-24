const gulp = require("gulp");
const gulp_zip = require("gulp-zip");
const gulp_json_modify = require("gulp-json-modify");
const merge_stream = require("merge-stream");
const pkg = require("./package.json");

gulp.task("bundle:chrome", function() {
    const others = gulp.src(["src/**", "!src/manifest.json"]);
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

gulp.task("bundle:firefox", function() {
    const others = gulp.src(["src/**", "!src/manifest.json"]);
    const manifest = gulp
        .src("src/manifest.json")
        .pipe(
            gulp_json_modify({
                key: "version",
                value: pkg.version,
            }),
        )
        .pipe(
            gulp_json_modify({
                key: "browser_specific_settings",
                value: {
                    gecko: {
                        id: "weibo-picture-store@ext.hub.moe",
                        strict_min_version: "68.0",
                    },
                },
            }),
        );

    return merge_stream(manifest, others)
        .pipe(gulp_zip("bundle.zip"))
        .pipe(gulp.dest("dist/firefox"));
});
