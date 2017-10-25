const astRegistry = require('../level0/ast-registry');

module.exports = function(source) {
  this.cacheable(true);
  this.addDependency(this.resource);

  if (this.compileBoxartFunction) {
    const done = this.async();
    this.compileBoxartFunction(this.resource, function(error, ast) {
      if (error) {
        done(error);
        return;
      }
      const _astRegistry = require('../level0/ast-registry');
      done(
        null,
        `
        const funcRegistry = require('./function-registry');
        module.exports = funcRegistry(${
          _astRegistry(ast).funcRegistry().toString()
        });
        `
      );
    });
    return;
  }

  return source;
  // throw new Error('Needs compile plugin');
  const astRegistry = require('../level0/ast-registry');
  return `
  const funcRegistry = require('./function-registry');
  module.exports = funcRegistry(${
    astRegistry(require(this.resource)).funcRegistry().toString()
  });
  `;
};
