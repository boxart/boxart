const fs = require('fs');
const {join, basename} = require('path');

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

const render = async ({src, destDir}) => {
  const script = await read({src});
  await write({
    dest: join(destDir, basename(src)),
    data: `
    const funcRegistry = require('./function-registry');
    module.exports = funcRegistry(${eval(script).toString()});
    `
  });
};

if (process.mainModule === module) {
  render({
    src: process.argv[2],
    destDir: process.argv[3],
  })
  .catch(e => console.error(e.stack || e));
}
