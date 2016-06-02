'use strict';

module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-eslint');

  grunt.config.set('eslint', {
    src: {
      options: {
        configFile: 'src/.eslintrc',
      },
      src: ['src/**/*.js{,x}'],
    },
    tests: {
      options: {
        configFile: 'tests/.eslintrc',
      },
      src: ['tests/**/*.js{,x}'],
    },
    config: {
      options: {
        configFile: '.eslintrc',
      },
      src: ['*.js', 'tasks/*.js'],
    },
  });
};
