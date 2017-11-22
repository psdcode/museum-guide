module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

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
      all: ['src/js/app.js']
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


  })
  require('load-grunt-tasks')(grunt)
}
