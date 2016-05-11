module.exports = function(grunt) {
  grunt.loadTasks('grunt');

  grunt.registerTask('publish', ['clean', 'babel', 'publish-modules'])
};
