const gulp = require('gulp');
const path = require('path');
const flatten = require('gulp-flatten');
const jeditor = require('gulp-json-editor');

gulp.task('default', ['packages']);

gulp.task(
    'definitions',
    copyTask({
        source: path.resolve('./src/definitions'),
        destination: path.resolve('./lib/definitions'),
        pattern: '**/*.d.ts',
        transform: flatten()
    })
);

gulp.task(
    'packages',
    copyTask({
        source: path.resolve('./src'),
        destination: path.resolve('./lib'),
        pattern: '**/package.json',
        transform: jeditor((json) => {
            if (json.main !== undefined) {
                json.main = json.main.replace(/\.ts$/, '.js');
            }

            if (json.typings) {
                json.typings = json.typings.replace(/\.ts$/, '.d.ts');
            }

            if (json.types) {
                json.types = json.types.replace(/\.ts$/, '.d.ts');
            }

            return json;
        })
    })
);


function copyTask(opts) {
    const {source, destination, destinations = [destination], pattern = '**/*', excludePattern, transform} = opts;

    return function () {
        let stream;
        if (excludePattern !== undefined) {
            stream = gulp.src([path.join(source, pattern), `!${path.join(source, excludePattern)}`], {base: source});
        } else {
            stream = gulp.src(path.join(source, pattern), {base: source});
        }

        if (transform !== undefined) {
            stream = stream.pipe(transform);
        }

        destinations.forEach((destination) => {
            stream = stream.pipe(gulp.dest(destination));
        });

        return stream;
    };
}