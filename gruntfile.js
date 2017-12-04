module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    babel: {
      options: {
        sourceMap: false
      },
      dist: {
        files: {
          'dist/js/app.js': 'src/js/app.js'
        }
      }
    },
    copy: {
      build: {
        files: [{
          expand: true,
          cwd: 'src',
          src: ['img/**', 'data/**'],
          dest: 'dist/'
        }]
      },
      dev: {
        files: [{
          expand: true,
          cwd: 'src',
          src: ['img/**/*', 'data/**/*', 'index.html', 'css/**/*'],
          dest: 'dist/'
        }]
      }
    },

    clean: {
      prebuild: {
        src: ['dist/*']
      },
      postuglify: {
        src: ['dist/js/app.js']
      }
    },

    jshint: {
      options: {
        force: true,
        reporter: require('jshint-stylish'),
        globals: {
          jQuery: false
        },
        esversion: 6,
        forin: true
      },
      all: ['src/js/**/*']
    },

    postcss: {
      options: {
        map: false,
        processors: [
          require('postcss-import')(),
          require('postcss-cssnext')(),
          // require('cssnano')()
        ]
      },
      dist: {
        files: [{
          expand: true,
          cwd: 'src/css/',
          src: '*.css',
          dest: 'dist/css/'
        }]
      }
    },

    processhtml: {
      dist: {
        files: {
          'dist/index.html': ['src/index.html']
        }
      }
    },

    stylelint: {
      all: ['src/css/**/*.css']
    },

    uglify: {
      options: {
        sourceMap: false,
        banner: '/*! <%= pkg.name %> | <%= pkg.author %> | <%= pkg.license %> */\n'
      },
      build: {
        src: 'dist/js/app.js',
        dest: 'dist/js/app.min.js'
      }
    },

    watch: {
      reload: {
        files: ['src/**/*', 'dist/css/*'],
        tasks: [],
        options: {
          livereload: true
        }
      },
      js: {
        files: ['src/js/**/*'],
        tasks: ['jshint']
      },
      css: {
        files: ['src/css/**/*'],
        tasks: ['stylelint']
      }
    }
  });

  require('load-grunt-tasks')(grunt);

  grunt.registerTask('build', [
    'jshint',
    'stylelint',
    'clean:prebuild',
    'copy:build',
    'babel',
    'uglify',
    'clean:postuglify',
    'processhtml',
    'postcss']);

  grunt.registerTask('dev', [
    'clean:prebuild',
    'copy:dev',
    'babel',
    'postcss'
  ]);
};
