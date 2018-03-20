module.exports = function (grunt) {
  const paths = grunt.file.readYAML('Gruntconfig.yml');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    copy: {
      build: {
        files: [{
          expand: true,
          cwd: paths.srcDir,
          src: ['img/**'],
          dest: paths.prodDir
        }]
      },
      dev: {
        files: [{
          expand: true,
          cwd: paths.srcDir,
          src: ['img/**/*', 'model/**/*', 'index.html'],
          dest: paths.prodDir
        }]
      }
    },

    clean: {
      prebuild: {
        src: [paths.prodDir + '*']
      },
      postuglify: {
        src: [paths.prodDirJs + 'app.js', paths.prodDirJs + 'vendor.js']
      }
    },

    filerev: {
      assets: {
        files: [{
          src: [
            paths.prodDirJs + '*.js',
            paths.prodDirCss + '*.css'
          ]
        }]
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
      all: [paths.srcDirJs + '**/*', paths.srcDir + 'model/**/*']
    },

    modernizr: {
      dist: {
        crawl: true,
        files: {
          src: [paths.prodDirJs + '**/*.js', paths.prodDirCss + '**/*.css']
        },
        customTests: [],
        dest: paths.srcDir + '/temp/modernizr.js',
        options: [
          'setClasses'
        ],
        uglify: true
      }
    },

    postcss: {
      prod: {
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
        src: paths.srcDirCss + 'styles.css',
        dest: paths.prodDirCss + 'styles.min.css'
      },
      dev: {
        options: {
          map: false,
          processors: [
            require('postcss-import')(),
            require('postcss-mixins')(),
            require('postcss-nested')(),
            require('postcss-cssnext')()
          ]
        },
        src: paths.srcDirCss + 'styles.css',
        dest: paths.prodDirCss + 'styles.css'
      }
    },

    processhtml: {
      docs: {
        files: {
          [paths.prodDir + 'index.html']: [paths.srcDir + 'index.html']
        }
      }
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
        files: [
          {
            expand: true,
            flatten: true,
            src: [paths.prodDirJs + 'app.js'],
            dest: paths.prodDirJs
          }
        ]
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
          [paths.prodDirJs + 'app.js']: [paths.srcDirJs + 'app.js']
        }
      },
      vendor: {
        files: {
          [paths.prodDirJs + 'vendor.js']: [paths.srcDirJs + 'vendor.js']
        }
      }
    },

    stylelint: {
      all: [paths.srcDirCss + '**/*.css']
    },

    uglify: {
      options: {
        sourceMap: false
      },
      app: {
        options: {
          banner: '/*! <%= pkg.name %> | <%= pkg.author %> | <%= pkg.license %> */\n'
        },
        src: paths.prodDirJs + 'app.js',
        dest: paths.prodDirJs + 'app.min.js'
      },
      vendor: {
        src: paths.prodDirJs + 'vendor.js',
        dest: paths.prodDirJs + 'vendor.min.js'
      }
    },

    usemin: {
      html: paths.prodDir + 'index.html'
    },

    watch: {
      reload: {
        files: [paths.prodDirJs + '**/*.js'],
        tasks: ['jshint'],
        options: {
          livereload: true
        }
      },
      // js: {
      //   files: [paths.prodDirJs + '**/*'],
      //   tasks: ['jshint']
      // },
      css: {
        files: [paths.prodDirCss + '**/*'],
        tasks: ['stylelint']
      }
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
    'postcss:prod',
    'filerev',
    'usemin',
    'modernizr'
  ]);

  grunt.registerTask('dev', [
    'clean:prebuild',
    'copy:dev',
    'rollup',
    'replace',
    'postcss:dev'
  ]);
};
