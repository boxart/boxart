const fs = require('fs');
const {relative} = require('path');

const read = ({src, encoding = 'utf8'}) => (
  new Promise((resolve, reject) => {
    fs.readFile(src, encoding, (error, data) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(data);
    });
  })
);

const write = ({dest, data, encoding = 'utf8'}) => (
  new Promise((resolve, reject) => {
    fs.writeFile(dest, data, encoding, error => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  })
);

const mkdir = ({dir}) => (
  new Promise((resolve, reject) => {
    fs.mkdir(dir, error => {
      if (error && error.code !== 'EEXIST') {
        reject(error);
        return;
      }
      resolve();
    });
  })
);

class FileSystem {
  // - context
  // - dryRun
  // - logger
  // - encoding
  constructor(options) {
    this.context = options.context;
    this.dryRun = options.dryRun;
    this.logger = options.logger;
    this.encoding = options.encoding || 'utf-8';
  }

  relative(_path) {
    return relative(this.context, _path);
  }

  read(options) {
    if (this.dryRun) {
      this.logger.log(`Read ${this.relative(options.src)}.`);
    }
    return read(Object.assign(
      {},
      {encoding: this.encoding},
      options
    ));
  }

  write(options) {
    if (this.dryRun) {
      this.logger.log(`Write ${this.relative(options.dest)}.`);
    }
    else {
      return write(Object.assign(
        {},
        {encoding: this.encoding},
        options
      ));
    }
  }

  mkdir(options) {
    if (this.dryRun) {
      this.logger.log(`Mkdir ${this.relative(options.dir)}.`);
    }
    else {
      return mkdir(Object.assign(
        {},
        {encoding: this.encoding},
        options
      ));
    }
  }
}

module.exports = {
  FileSystem,
};
