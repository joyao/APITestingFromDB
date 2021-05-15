const gulp = require("gulp");
const ts = require("gulp-typescript");
const uglify = require("gulp-uglify");
const tsProject = ts.createProject("tsconfig.json", {
    target: "ES5",
});

gulp.task("tsc", async () => {
    await gulp
        .src("src/**/*.ts")
        .pipe(tsProject())
        // .js.pipe(uglify())
        .pipe(gulp.dest("dist"));
});
