module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-karma');

  grunt.config.set('karma', {
    dev: {
      // Configure mocha
      client: {
        mocha: {
          // change Karma's debug.html to the mocha web reporter
          reporter: 'html',
          ui: 'bdd',
        },
      },
      configFile: 'karma.conf.js',
    },
  });
};
