const {join, resolve} = require('path');

const {FileSystem} = require('./filesystem');
const {getopts} = require('./getopts');

class Runtime {
  constructor(options) {
    this.context = options.context;
    this.dryRun = options.dryRun;
    this.runtime = this;
    this.logger = new Logger(Object.assign({}, this));
    this.fileSystem = new FileSystem(Object.assign({}, this));
  }

  spawn({command, args, cwd}) {
    if (this.dryRun) {
      this.logger.log(`Spawn ${command}.`);
      return;
    }

    return;

    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        cwd,
      });

      const concat = stream => {
        return new Promise((resolve, reject) => {
          let buffer = [];
          stream.on('data', data => {
            buffer = buffer.concat(Array.from(data));
          });
          stream.on('error', reject);
          stream.on('end', () => {
            resolve(new Buffer(buffer));
          });
        });
      };

      const stdout = concat(child.stdout);
      const stderr = concat(child.stderr);

      child.on('exit', () => {
        Promise.all([stdout, stderr]).then(([stdout, stderr]) => {
          resolve({
            stdout,
            stderr,
          });
        }, reject);
      });
    });
  }
}

let _runtime;

Runtime.get = function() {
  if (!_runtime) {
    const options = {
      context: resolve(),
    };
    for (const [key, value] of getopts()) {
      if (key === 'd' || key === 'context') {
        options.context = resolve(value);
      }
      if (key === 'n' || key === 'dry-run') {
        options.dryRun = true;
      }
    }
    _runtime = new Runtime(options);
  }
  return _runtime;
};

class Logger {
  constructor(options) {
    this.options = options;
  }

  debug(...args) {
    console.debug(...args);
  }

  info(...args) {
    console.info(...args);
  }

  log(...args) {
    console.log(...args);
  }

  warn(...args) {
    console.warn(...args);
  }

  error(...args) {
    console.error(...args);
  }
}

module.exports = {
  Runtime,
};
