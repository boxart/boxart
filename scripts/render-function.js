const {join, basename} = require('path');

const {Runtime} = require('./runtime');
const {getopts} = require('./getopts');

const render = async ({src, destDir, fileSystem}) => {
  const script = await fileSystem.read({src});
  await fileSystem.write({
    dest: join(destDir, basename(src)),
    data: `
    const funcRegistry = require('./function-registry');
    module.exports = funcRegistry(${eval(script).toString()});
    `
  });
};

if (process.mainModule === module) {
  const options = {};
  for (const [key, value] of getopts()) {
    if (key === 'i') {
      options.src = value;
    }
    if (key === 'o') {
      options.destDir = value;
    }
  }
  render(Object.assign({}, Runtime.get(), options))
  .catch(e => console.error(e.stack || e));
}
