'use strict'

import gulp from 'gulp'
import babel from 'gulp-babel'
import concat from 'gulp-concat'
import sass from 'gulp-sass'
import autoprefixer from 'gulp-autoprefixer'
import sourcemaps from 'gulp-sourcemaps'

const paths = {
  src: './style/app.scss',
  dest: './public/css'
}

const sassOptions = {
  errLogToConsole: true,
  outputStyle: 'expanded'
}

// Normal styles build
gulp.task('build-css', () => (
  gulp.src(paths.src)
    .pipe(sourcemaps.init())
    .pipe(sass(sassOptions).on('error', sass.logError))
    .pipe(autoprefixer())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(paths.dest))
))

gulp.task('build-js', () => (
  gulp.src('./lib/*.js')
    .pipe(concat('bundle.js'))
    .pipe(babel({presets: ["es2015"]}))
    .pipe(gulp.dest('./public/js'))
))

gulp.task('watch', () => {
  gulp.watch('./lib/*.js', ['build-js'])
  gulp.watch('./style/**/*.scss', ['build-css'])
})