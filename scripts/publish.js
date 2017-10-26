const {join} = require('path');

const {Runtime} = require('./runtime');
const {getopts} = require('./getopts');

const packages = [
  {
    name: 'boxart-functions',
    main: 'boxart/lib/level0',
    module: 'boxart/src/level0',
  },
  {
    name: 'boxart-webpack-plugin',
    main: 'boxart/lib/webpack/function-compile-plugin',
    module: 'boxart/src/webpack/function-compile-plugin',
  },
  {
    name: 'boxart-preact',
    main: 'boxart/lib/level3/preact-no0',
    module: 'boxart/src/level3/preact-no0',
  },
  {
    name: 'boxart-element',
    main: 'boxart/lib/level3/svg-no0',
    module: 'boxart/src/level3/svg-no0',
  },
];

const template = ({name, version, main, module}) => `{
  "name": "${name}",
  "version": "${version}",
  "description": "",
  "main": "${main}",
  "module": "${module}",
  "keywords": [],
  "author": {
    "name": "Michael \\"Z\\" Goddard",
    "email": "mzgoddard@gmail.com"
  },
  "license": "ISC",
  "dependencies": {
    "boxart": "${version}"
  }
}
`;

const dir = (...args) => join(__dirname, ...args);

const generatePackage = async ({
  packageInfo,
  fileSystem,
}) => {
  const boxartPackageRaw = await fileSystem.read({src: dir('../package.json')});
  const boxartPackage = JSON.parse(boxartPackageRaw);
  await fileSystem.mkdir({dir: dir(`../packages/${packageInfo.name}`)});
  await fileSystem.write({
    dest: dir(`../packages/${packageInfo.name}/package.json`),
    data: template(Object.assign({
      version: boxartPackage.version,
    }, packageInfo)),
  });
};

const publishPackage = async ({
  packageInfo,
  fileSystem,
  runtime,
}) => {
  await runtime.spawn({
    command: 'npm',
    args: ['publish'],
    cwd: dir(`../packages/${packageInfo.name}`),
  });
};

const main = async (options) => {
  await options.fileSystem.mkdir({dir: dir('../packages')});
  for (const packageInfo of packages) {
    await generatePackage(Object.assign({}, options, {packageInfo}));
  }
  for (const packageInfo of packages) {
    await publishPackage(Object.assign({}, options, {packageInfo}));
  }
};

if (process.mainModule === module) {
  const runtime = Runtime.get();
  const options = {};
  for (const [key, value] of getopts()) {
  }
  main(Object.assign({}, runtime, options))
  .catch(e => console.error(e.stack || e));
}
