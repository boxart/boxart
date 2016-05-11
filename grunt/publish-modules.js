module.exports = function(grunt) {
  var fs = require('fs');
  var path = require('path');
  var spawn = require('child_process').spawn;

  function npmPublish(cwd) {
    return new Promise(function(resolve, reject) {
      if (grunt.option('dry-run')) {
        grunt.log.write('spawn npm publish {cwd: ' + cwd +'}\n');
        resolve();
      }
      else {
        var child = spawn('npm', ['publish'], {
          stdio: 'inherit',
          cwd: path.resolve(cwd || ''),
        });
        child.on('error', reject);
        child.on('exit', resolve);
      }
    });
  }

  function promisify(fn, ctx) {
    return function() {
      var args = [].slice.call(arguments);
      return new Promise(function(resolve, reject) {
        args.push(function(error, result) {
          if (error) {
            reject(error);
          }
          else if (arguments.length === 2) {
            resolve(result);
          }
          else {
            resolve([].slice.call(arguments, 1));
          }
        });
        fn.apply(ctx, args);
      });
    };
  }

  grunt.registerTask('publish-modules', function() {
    var done = this.async();

    var readdir = promisify(fs.readdir, fs);
    var readFile = promisify(fs.readFile, fs);
    var writeFile = promisify(fs.writeFile, fs);

    var version = readFile('package.json', 'utf8')
    .then(JSON.parse)
    .then(function(package) {return package.version;});
    var packages = readdir('packages');

    return Promise.all([packages, version])
    // Update package versions to mirror boxart.
    .then(function(values) {
      var packages = values[0];
      var version = values[1];
      return Promise.all(packages.map(function(packageName) {
        var subpackagePath = path.join('packages', packageName, 'package.json');
        readFile(subpackagePath, 'utf8')
        .then(JSON.parse)
        .then(function(package) {
          package.version = version;
          package.peerDependencies.boxart = '^' + version;
          return writeFile(subpackagePath, JSON.stringify(package, null, '  '), 'utf8');
        });
      }));
    })
    // Publish boxart itself.
    .then(function() {
      grunt.log.write('Publish boxart.\n');
      return npmPublish();
    })
    // Publish boxart packages.
    .then(function() {return packages;})
    .then(function(packages) {
      return packages.reduce(function(carry, packageName) {
        return carry
        .then(function() {
          grunt.log.write('Publish ' + packageName + '.\n');
          return npmPublish(path.join('packages', packageName));
        });
      }, Promise.resolve());
    })
    // All done. Say how many were published.
    .then(function() {return packages;})
    .then(function(packages) {
      grunt.log.ok('Published ' + (1 + packages.length) + ' packages.');
    })
    .then(function() {done();}, done);
  });
};
