module.exports = function(grunt) {
  grunt.loadTasks('grunt');

  grunt.registerTask('test-dev', 'karma:dev');
  grunt.registerTask('publish', ['clean', 'babel', 'publish-modules'])
};
