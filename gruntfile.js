module.exports = function (grunt) {
  const paths = grunt.file.readYAML('Gruntpaths.yml');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    concurrent: {
      target: [
        'watch:reload',
        'watch:js',
        'watch:css'
      ],
      options: {
        logConcurrentOutput: true
      }
    },

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
            require('postcss-hexrgba')(),
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
            require('postcss-cssnext')(),
            require('postcss-hexrgba')()
          ]
        },
        src: paths.srcDirCss + 'styles.css',
        dest: paths.prodDirCss + 'styles.css'
      },
      px2rem: {
        options: {
          map: false,
          processors: [require('postcss-pxtorem')()]
        },
        src: paths.srcDirCss + '**/*.css'
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
              replacement: 'var museumMapApp = (function ()'
            },
            {
              match: /\/\/\sGruntReplacePosition\s+}\(\)\);/,
              replacement: 'return GoogleMapView.returnModule();\n }());'
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
        plugins: [
          require('rollup-plugin-babel')({
            exclude: ['./node_modules/**', '**/*.json'],
            babelrc: false,
            presets: [['env', { 'modules': false }]],
            plugins: ['external-helpers']
          }),
          require('rollup-plugin-node-resolve')({ jsnext: true }),
          // Note: latest 9.1.0 version of rollup-plugin-commonjs gives error, rolled back to 8.4.1 and works
          require('rollup-plugin-commonjs')({
            sourceMap: false
          }),
          require('rollup-plugin-json')({
            exclude: 'node_modules/**'
          })
        ]
      },

      app: {
        options: {
          format: 'iife'
        },
        files: {
          [paths.prodDirJs + 'app.js']: [paths.srcDirJs + 'app.js']
        }
      },
      vendor: {
        options: {
          format: 'es'
        },
        files: {
          [paths.prodDirJs + 'vendor.js']: [paths.srcDirJs + 'vendor.js']
        }
      }
    },

    stylelint: {
      options: {
        failOnError: false
      },
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
        files: [paths.prodDirCss + '**/*.css'],
        tasks: [],
        options: {
          livereload: true
        }
      },
      js: {
        files: [paths.srcDirJs + '**/*.js'],
        tasks: ['jshint']
      },
      css: {
        files: [paths.srcDirCss + '**/*.css'],
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

  grunt.registerTask('watchAll', [
    'concurrent'
  ]);
};
