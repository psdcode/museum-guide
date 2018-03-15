module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    copy: {
      build: {
        files: [{
          expand: true,
          cwd: 'src',
          src: ['img/**', 'model/**'],
          dest: 'docs/'
        }]
      },
      dev: {
        files: [{
          expand: true,
          cwd: 'src',
          src: ['img/**/*', 'model/**/*', 'index.html'],
          dest: 'docs/'
        }]
      }
    },

    clean: {
      prebuild: {
        src: ['docs/*']
      },
      postuglify: {
        src: ['docs/js/app.js']
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
      all: ['docs/js/**/*', 'docs/model/**/*']
    },

    rename: {
      main: {
        files: [
          {
            src: ['docs/css/styles.css'], dest: 'docs/css/styles.min.css'
          }
        ]
      }
    },

    rollup: {
      options: {
        format: 'es',
        plugins: [
          require('rollup-plugin-babel')({
            presets: [['env', { 'modules': false }]],
            plugins: ['external-helpers']
          })
        ]
      },

      docs: {
        files: {
          'docs/js/app.js': ['src/js/app.js']
        }
      }
    },

    postcss: {
      options: {
        map: false,
        processors: [
          require('postcss-import')(),
          require('postcss-mixins')(),
          require('postcss-nested')(),
          require('postcss-cssnext')(),
          require('cssnano')()
        ]
      },
      docs: {
        files: [{
          expand: true,
          cwd: 'src/css/',
          src: 'styles.css',
          dest: 'docs/css/'
        }]
      }
    },

    processhtml: {
      docs: {
        files: {
          'docs/index.html': ['src/index.html']
        }
      }
    },

    stylelint: {
      all: ['docs/css/**/*.css']
    },

    uglify: {
      options: {
        sourceMap: false,
        banner: '/*! <%= pkg.name %> | <%= pkg.author %> | <%= pkg.license %> */\n'
      },
      build: {
        src: 'docs/js/app.js',
        dest: 'docs/js/app.min.js'
      }
    },

    watch: {
      reload: {
        files: ['src/**/*'],
        tasks: ['dev'],
        options: {
          livereload: true
        }
      }// ,
      // js: {
      //   files: ['src/js/**/*'],
      //   tasks: ['jshint']
      // },
      // css: {
      //   files: ['src/css/**/*'],
      //   tasks: ['stylelint']
      // }
    }
  });

  require('load-grunt-tasks')(grunt);

  grunt.registerTask('build', [
    'jshint',
    'stylelint',
    'clean:prebuild',
    'copy:build',
    'rollup',
    'uglify',
    'clean:postuglify',
    'processhtml',
    'postcss',
    'rename'
  ]);

  grunt.registerTask('dev', [
    'clean:prebuild',
    'copy:dev',
    'rollup',
    'postcss'
  ]);
};
