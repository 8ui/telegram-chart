const gulp = require('gulp');
const fs = require('fs');
var $ = require('gulp-load-plugins')();

const source = './app';
const port = 8889;

gulp.task('connect', function(){
	$.connect.server({
		root: source,
		port: port,
		livereload: {
			port: 35735
		}
	})
});

// convert scss to css
gulp.task('sass', function() {
	return gulp.src(source + '/scss/index.scss')
		.pipe($.sass())
		// .pipe($.rename('main.css'))
		.pipe($.concat('main.css'))
		.pipe(gulp.dest(source + '/css'));
});


gulp.task('watch', function(){
	gulp.watch(source + '/scss/*.scss', ['sass']);

	gulp.watch([source + '/css/main.css'], function (event) {
    return gulp.src(event.path)
      .pipe($.connect.reload());
  })
});

// default task
gulp.task('default', ['watch', 'connect']);
