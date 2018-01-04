const astRegistry = require('../level0/ast-registry');

module.exports = function(source) {
  this.cacheable(true);
  // this.addDependency(this.resource);

  if (this._inBoxartFunction) {
    return source;
  }

  if (this.compileBoxartFunction) {
    const done = this.async();
    this.compileBoxartFunction(this.resource, function(error, registry) {
      if (error) {
        done(error);
        return;
      }
      done(
        null,
        `
        const funcRegistry = require('./function-registry');
        module.exports = funcRegistry(${
          registry.funcRegistry().toString()
        });
        `
      );
    });
    return;
  }

  return source;
};
