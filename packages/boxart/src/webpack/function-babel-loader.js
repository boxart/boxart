const babel = require('babel-core');
const {transform} = babel.default || babel;

const plugin = require('../level0/function-babel');

module.exports = function(source) {
  this.cacheable(true);
  this.addDependency(this.resource);

  if (this._inBoxartFunction) {
    return source;
  }

  // Add marking comment above any statement that is not an import or require.
  // After webpack compile, remove marked lines.
  // Visit source, on a function
  // - Modify function body, 
  // - Evaluate compiled source with modifunction injected
  

  const done = this.async();
  this.compileBoxartFunction(this.resource, function(error, animations) {
    if (error) {
      return done(error);
    }
    const result = transform(input, {
      plugins: [function() {
        return {
          visitor: {
            Function(path, state) {
              
            },
          },
        };
      }],
    });
    return done(null, source);
  });
};
