const {transform} = require('babel-core');
const boxartPlugin = require('../level0/function.babel');

function compileSource(source) {
  return transform(source, {
    plugins: [boxartPlugin],
  }).code;
}

function _stringify(obj) {
  if (obj && typeof obj === 'object') {
    if (Array.isArray(obj)) {
      return `[${obj.map(_stringify).join(', ')}]`;
    }
    return `{${
      Object.entries(obj)
      .map(([key, value]) => (
        `${JSON.stringify(key)}: ${_stringify(value)}`
      ))
      .join(', ')
    }}`;
  }
  else if (typeof obj === 'function') {
    return obj.toString();
  }
  return JSON.stringify(obj);
}

function verifyBindings(source) {
  function mustHaveBinding({types: t}) {
    return {
      visitor: {
        Identifier(path, scope) {
          if (
            t.isMemberExpression(path.parent) && path.parent.object === path.node ||
            t.isMemberExpression(path.parent) && path.parent.computed ||
            !t.isMemberExpression(path.parent)
          ) {
            if (!scope.getBinding(path.node.name)) {
              throw new Error(`"${path.node.name} is not defined in boxart function."`);
            }
          }
        },
      },
    };
  }

  transform(source, {
    plugins: [mustHaveBinding],
  });

  return source;
}

module.exports = function(source) {
  this.cacheable(true);
  this.addDependency(this.resource);

  if (this.boxartSource) {
    return this.boxartSource();
  }

  if (this._inBoxartFunction) {
    return source;
  }

  const done = this.async();

  // Transform source, incorporating local functions
  const transformed = compileSource(source);

  this.compileBoxartFunction({
    resource: this.resource,
    source: transformed,
  }, function(error, animations) {
    if (error) {
      return done(error);
    }

    // "stringify" output. Verify that all bindings are met inside individual
    // functions. Unmet bindings mean, something wasn't able to be inlined and
    // we should abort, emit a warning, and return the original source.

    try {
      return done(
        null,
        `module.exports = ${verifyBindings(_stringify(animations))};`
      );
    }
    catch (e) {
      this.emitWarning(e);
      return done(null, source);
    }
  });
};
