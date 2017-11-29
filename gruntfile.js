module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    clean: {
      dev: {
        src: ['dist/*']
      }
    },
    mkdir: {
      options: {
        create: ['dist/img']
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
      all: ['src/js/app.js', 'src/data/model.js']
    },

    watch: {
      options: {
        livereload: true
      },
      reload: {
        files: ['src/index.html', 'src/css/style.css', 'src/js/app.js'],
        tasks: [],
        options: {
          spawn: false
        }
      }
    }

  });
  require('load-grunt-tasks')(grunt);
  grunt.registerTask('build', ['jshint', 'clean']); //,'jshint','babel','uglify'])
};

// csslint: {
// 			strict: {
// 				options: {
// 					important: 2
// 				},
// 				src: "<%= sass.dist.dest =>"
// 			},
//
// postcss: {
//             options: {
//               map: {
//                 inline: false,
//                 annotation: 'css/maps'
//               },
//               processors: [
//                 require('autoprefixer')({browsers: 'last 2 versions'})
//                 ]
//             },
//             dist: {
//               src: 'css/style.css'
//             }
//           },
//
// cssmin: {
//               options: {
//                 // TODO: disable `zeroUnits` optimization once clean-css 3.2 is released
//                 //    and then simplify the fix for https://github.com/twbs/bootstrap/issues/14837 accordingly
//                 compatibility: 'ie8',
//                 keepSpecialComments: '*',
//                 sourceMap: true,
//                 sourceMapInlineSources: true,
//                 advanced: false
//               },
//               minifyCore: {
//                 src: 'dist/css/<%= pkg.name %>.css',
//                 dest: 'dist/css/<%= pkg.name %>.min.css'
//               },
//               minifyTheme: {
//                 src: 'dist/css/<%= pkg.name %>-theme.css',
//                 dest: 'dist/css/<%= pkg.name %>-theme.min.css'
//               },
//               docs: {
//                 src: [
//                   'docs/assets/css/ie10-viewport-bug-workaround.css',
//                   'docs/assets/css/src/pygments-manni.css',
//                   'docs/assets/css/src/docs.css'
//                 ],
//                 dest: 'docs/assets/css/docs.min.css'
//               }
//             }
//
//             /* Clear out the images directory if it exists */
//                 clean: {
//                   dev: {
//                     src: ['images'],
//                   },
//                 },
//
//                 /* Generate the images directory if it is missing */
//                 mkdir: {
//                   dev: {
//                     options: {
//                       create: ['images']
//                     },
//                   },
//                 },
//
//                 /* Copy the "fixed" images that don't go through processing into the images/directory */
//                 copy: {
//                   dev: {
//                     files: [{
//                       expand: true,
//                       src: ['images_src/fixed/*.{gif,jpg,png}'],
//                       dest: 'images/',
//                       flatten: true,
//                     }]
//                   },
//                 },
//                 uglify: {
// 			build: {
// 				src: 'js/build/production.js',
// 				dest: 'js/build/production.min.js'
// 			}
// 		},
//     // Before generating any new files, remove any previously-created files.
//     clean: {
//       tests: ['tmp', '!tmp/new_files_only/magikarp-200.png', '!tmp/new_files_only/magikarp-300.png']
//     },
//     // Add vendor prefixed styles
//  postcss: {
//    options: {
//      processors: [
//        require('autoprefixer-core')({browsers: ['last 1 version']})
//      ]
//    },
//    server: {
//      options: {
//        map: true
//      },
//      files: [{
//        expand: true,
//        cwd: '.tmp/styles/',
//        src: '{,*/}*.css',
//        dest: '.tmp/styles/'
//      }]
//    },
//    dist: {
//      files: [{
//        expand: true,
//        cwd: '.tmp/styles/',
//        src: '{,*/}*.css',
//        dest: '.tmp/styles/'
//      }]
//    }
//  },
