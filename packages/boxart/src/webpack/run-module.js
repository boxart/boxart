const path = require('path');
const vm = require('vm');

function wrapModule(code) {
  return '(function(exports, require, module, __filename, __dirname) {' +
    code +
  '})';
}

function callModule(fn, filename) {
  const module = {exports: {}};
  fn.call(module.exports, module.exports, Object.assign(function(modulename) {
    if (/\W/.test(modulename[0])) {
      return require(path.join(path.dirname(filename), modulename));
    }
    return require(modulename);
  }, require), module, filename, path.dirname(filename));
  return module;
}

module.exports = function(source, resource) {
  if (source[0] === '{' || source[0] === '[') {
    return JSON.parse(source);
  }
  return callModule(vm.runInThisContext(
    wrapModule(source),
    {filename: resource}
  ), resource);
};
