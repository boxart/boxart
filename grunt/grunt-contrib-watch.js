module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.config.set('watch', {
    babel: {
      files: ['src/**/*.js'],
      tasks: ['babel:build']
    }
  });
};
