module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-babel');

  grunt.config.set('babel', {
    build: {
      files: [{
        cwd: 'src',
        expand: true,
        src: '*.js',
        dest: 'lib',
      }],
    },
  });
};
