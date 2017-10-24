const compile = require('../level0/function-ast.auto');

module.exports = function(source) {
  this.cacheable(true);
  this.addDependency(this.resource);

  console.log(this.resource, this._inBoxartFunction);

  if (this._inBoxartFunction) {
    return source;
  }

  const done = this.async();
  this.compileBoxartFunction(this.resource, function(error, animations) {
    if (error) {
      return done(error);
    }
    // console.log(animations);
    // console.log(`
    // module.exports = {
    //   ${Object.entries(animations).map(([name, type]) => {
    //     return `${name}: {
    //       ${Object.entries(type).map(([name, animation]) => {
    //         return `${name}: {
    //           ${Object.entries(animation).map(([component, func]) => {
    //             return `${component}: ${func.toString()}()`;
    //           }).join(',')}
    //         }`;
    //       }).join(',')}
    //     }
    //     `;
    //   }).join(',')}
    // };
    // `);
    return done(null, `
    module.exports = {
      ${Object.entries(animations).map(([name, type]) => {
        return `${name}: {
          ${Object.entries(type).map(([name, animation]) => {
            return `${name}: {
              ${Object.entries(animation).map(([component, func]) => {
                return `${component}: ${compile(func, component === 'animate' ? {methods: ['eq']} : {}).toString()}()`;
              }).join(',')}
            }`;
          }).join(',')}
        }
        `;
      }).join(',')}
    };
    `);
  });
};
