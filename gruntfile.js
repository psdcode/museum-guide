module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    copy: {
      build: {
        files: [{
          expand: true,
          cwd: 'src',
          src: ['img/**'],
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
        src: ['docs/js/app.js', 'docs/js/vendor.js']
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
      all: ['src/js/**/*', 'src/model/**/*']
    },

    modernizr: {
      dist: {
        crawl: true,
        files: {
          src: ['./docs/js/**/*.js', './docs/css/**/*.css']
        },
        customTests: [],
        dest: './src/temp/modernizr.js',
        options: [
          'setClasses'
        ],
        uglify: true
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
        src: 'src/css/styles.css',
        dest: 'docs/css/styles.min.css'
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
      all: ['src/css/**/*.css']
    },

    replace: {
      dist: {
        options: {
          patterns: [
            {
              match: /^\(function\s\(\)/,
              replacement: 'var museumMapApp = (function (global)'
            },
            {
              match: /\/\/\sEnd\s+}\(\)\);/,
              replacement: 'return {\n\t\terrorLoadMap: GoogleMapView.errorLoadMap' +
                ',\n\t\tinitMap: GoogleMapView.initMap\n\t};\n }(window));'
            }
          ]
        },
        files: [{expand: true, flatten: true, src: ['docs/js/app.js'], dest: 'docs/js/'}]
      }
    },

    filerev: {
      assets: {
        files: [{
          src: [
            'docs/js/*.js',
            'docs/css/*.css'
          ]
        }]
      }
    },

    rollup: {
      options: {
        format: 'iife',
        plugins: [
          require('rollup-plugin-babel')({
            presets: [['env', { 'modules': false }]],
            plugins: ['external-helpers']
          }),
          require('rollup-plugin-node-resolve')({ jsnext: true })
        ]
      },

      app: {
        files: {
          'docs/js/app.js': ['src/js/app.js']
        }
      },
      vendor: {
        files: {
          'docs/js/vendor.js': ['src/js/vendor.js']
        }
      }
    },

    uglify: {
      options: {
        sourceMap: false
      },
      app: {
        options: {
          banner: '/*! <%= pkg.name %> | <%= pkg.author %> | <%= pkg.license %> */\n'
        },
        src: 'docs/js/app.js',
        dest: 'docs/js/app.min.js'
      },
      vendor: {
        src: 'docs/js/vendor.js',
        dest: 'docs/js/vendor.min.js'
      }
    },

    usemin: {
      html: 'docs/index.html'
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

  grunt.registerTask('prod', [
    'jshint',
    'stylelint',
    'clean:prebuild',
    'copy:build',
    'rollup',
    'replace',
    'uglify',
    'clean:postuglify',
    'processhtml',
    'postcss',
    'filerev',
    'usemin',
    'modernizr'
  ]);

  grunt.registerTask('dev', [
    'clean:prebuild',
    'copy:dev',
    'rollup',
    'replace',
    'postcss'
  ]);
};
