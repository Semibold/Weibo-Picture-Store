const fs = require("fs");
const gulp = require("gulp");
const gulp_zip = require("gulp-zip");
const gulp_json_modify = require("gulp-json-modify");
const merge_stream = require("merge-stream");

gulp.task("bundle", function () {
    const pkg = JSON.parse(fs.readFileSync("./package.json", {encoding: "utf8"}));
    const others = gulp.src(["src/**", "!src/manifest.json"]);
    const manifest = gulp.src("src/manifest.json")
        .pipe(gulp_json_modify({
            key: "version",
            value: pkg.version,
        }));

    return merge_stream(manifest, others)
        .pipe(gulp_zip("bundle.zip"))
        .pipe(gulp.dest("dist"));
});
