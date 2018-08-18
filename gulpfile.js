var syntax        = 'sass'; // Syntax: sass or scss;

var gulp          = require('gulp'),
		gutil         = require('gulp-util' ),
		sass          = require('gulp-sass'),
		browserSync   = require('browser-sync'),
		concat        = require('gulp-concat'),
		uglify        = require('gulp-uglify'),
		cleancss      = require('gulp-clean-css'),
		rename        = require('gulp-rename'),
		autoprefixer  = require('gulp-autoprefixer'),
		notify        = require("gulp-notify"),
		fileinclude		= require('gulp-file-include'),
		del          = require('del'),
		imagemin     = require('gulp-imagemin'),
		pngquant     = require('imagemin-pngquant'),
		cache        = require('gulp-cache'),
		rsync        = require('gulp-rsync');

gulp.task('fileinclude', function() {
	gulp.src(['app/*.html'])
		.pipe(fileinclude({
			prefix: '@@',
			basepath: '@file'
		}))
	.pipe(gulp.dest('builder'))
});

gulp.task('browser-sync', function() {
	browserSync({
		server: {
			baseDir: 'builder'
		},
		notify: false,
		// open: false,
		// online: false, // Work Offline Without Internet Connection
		// tunnel: true, tunnel: "projectname", // Demonstration page: http://projectname.localtunnel.me
	})
});

gulp.task('styles', function() {
	return gulp.src('app/'+syntax+'/**/*.'+syntax+'')
	.pipe(sass({ outputStyle: 'expanded' }).on("error", notify.onError()))
	.pipe(rename({ suffix: '.min', prefix : '' }))
	.pipe(autoprefixer(['last 15 versions']))
	.pipe(cleancss( {level: { 1: { specialComments: 0 } } })) // Opt., comment out when debugging
	.pipe(gulp.dest('builder/css'))
	.pipe(browserSync.stream())
});

gulp.task('css-redirect', function() {
	return gulp.src(['app/css/**/*.css'])
		.pipe(gulp.dest('builder/css')) // Выгружаем в папку
		.pipe(browserSync.reload({stream: true}))
});

gulp.task('img', function() {
	return gulp.src('builder/img/**/*') // Берем все изображения из app
		.pipe(cache(imagemin({  // Сжимаем их с наилучшими настройками с учетом кеширования
			interlaced: true,
			progressive: true,
			svgoPlugins: [{removeViewBox: false}],
			use: [pngquant()]
		})))
	.pipe(gulp.dest('dist/img')); // Выгружаем на продакшен
});

gulp.task('img-redirect', function() {
	return gulp.src(['app/img/**/*'])
		.pipe(gulp.dest('builder/img')); // Выгружаем в папку
});


gulp.task('fonts-redirect', function() {
	return gulp.src(['app/fonts/**/*'])
		.pipe(gulp.dest('builder/fonts')) // Выгружаем в папку
		.pipe(browserSync.reload({stream: true}))
});

gulp.task('js', function() {
	return gulp.src([
		'app/libs/jquery/dist/jquery.min.js',
		'app/libs/uikit/uikit.min.js',
		'app/libs/uikit/uikit-icons.min.js',
		'app/js/common.js' // Always at the end
		])
	.pipe(concat('scripts.min.js'))
	// .pipe(uglify()) // Mifify js (opt.)
	.pipe(gulp.dest('builder/js'))
	.pipe(browserSync.reload({ stream: true }))
});

gulp.task('rsync', function() {
	return gulp.src('builder/**')
	.pipe(rsync({
		root: 'builder/',
		hostname: 'username@yousite.com',
		destination: 'yousite/public_html/',
		// include: ['*.htaccess'], // Includes files to deploy
		exclude: ['**/Thumbs.db', '**/*.DS_Store'], // Excludes files from deploy
		recursive: true,
		archive: true,
		silent: false,
		compress: true
	}))
});

gulp.task('watch', ['styles', 'js', 'browser-sync', 'fonts-redirect', 'css-redirect', 'fileinclude', 'img-redirect'], function() {
	gulp.watch('app/'+syntax+'/**/*.'+syntax+'', ['styles']);
	gulp.watch(['libs/**/*.js', 'app/js/common.js'], ['js']);
	gulp.watch('app/**/*.html', ['fileinclude']); // Наблюдение за HTML файлами в корне проекта
	gulp.watch('app/**/*.html', browserSync.reload);
});

gulp.task('clean', function() {
		return del.sync('dist'); // Удаляем папку dist перед сборкой
});

gulp.task('build', ['clean', 'img', 'styles', 'js'], function() {

		var buildCss = gulp.src([ // Переносим библиотеки в продакшен
				'builder/css/main.css',
				'builder/css/uikit.min.css'
				])
		.pipe(gulp.dest('dist/css'))

		var buildFonts = gulp.src('app/fonts/**/*') // Переносим шрифты в продакшен
		.pipe(gulp.dest('dist/fonts'))

		var buildJs = gulp.src('builder/js/**/[^_]*.js') // Переносим скрипты в продакшен
		.pipe(gulp.dest('dist/js'))

		var buildHtml = gulp.src(['builder/[^_]*.html', '!builder/builder.html']) // Переносим HTML в продакшен
		.pipe(gulp.dest('dist'));

});

gulp.task('clear', function () {
		return cache.clearAll();
})

gulp.task('default', ['watch']);
