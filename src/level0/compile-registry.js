const compile = require('./function.babel.compile').default;
const funcRegistry = require('./function-registry');

const create = (fn, constructor = {}) => {
  function PresentFunction(f, original) {
    if (original) {
      f.asfunc = function() {
        return compile(original, registry)();
      };
    }
    return Object.setPrototypeOf(f, PresentFunction.prototype);
  }
  PresentFunction.prototype = Object.create(Function.prototype);
  PresentFunction.prototype.constructor = PresentFunction;

  function PresentObject(f) {
    return Object.setPrototypeOf(f, PresentObject.prototype);
  }
  PresentObject.prototype = Object.create(Object.prototype);
  PresentObject.prototype.constructor = PresentObject;

  PresentObject.prototype.compile = function() {
    return compile(this, registry)();
  };

  const clearNesting = args => {
    args.forEach(a => {
      if (Object.getPrototypeOf(a) === PresentObject.prototype) {
        Object.setPrototypeOf(a, Function.prototype);
      }
    });
  };

  const lazyCompile = (fn) => {
    fn._compiled = fn._compiled || compile(fn, registry)();
    return fn._compiled;
  };

  const lazyCall = (fn) => (...args) => {
    return lazyCompile(fn)(...args);
  };

  const lazyKeyCall = (fn, key) => (...args) => {
    return lazyCompile(fn)[key](...args);
  };

  let autobind = true;

  function bindDefinition(fn, origin, args) {
    if (!autobind) {return fn;}
    try {
      const wrapped = Object.assign(lazyCall(fn), fn);
      Object.defineProperty(fn, 'meta', {
        value: {origin, args},
        enumerable: false,
      });
      Object.defineProperty(wrapped, 'meta', {
        value: {origin, args},
        enumerable: false,
      });
      Object.keys(fn).forEach(function(key) {
        wrapped[key] = lazyKeyCall(fn, key);
      });
      return wrapped;
    } catch(e) {
      console.error(e);
      return fn;
    }
  }

  const registry = {};
  const present = Object.create(constructor);
  Object.defineProperties(present, {
    create: {
      enumerable: false,
      value(fn, constructor) {
        if (typeof fn === 'function') {
          return create(() => Object.assign({}, registry, fn()), constructor);
        }
        else {
          return create(Object.assign({}, registry, fn), constructor);
        }
      },
    },
    funcRegistry: {
      enumerable: false,
      value(options) {
        const o = {};
        Object.entries(present).forEach(([key, value]) => {
          o[key] = value.asfunc(options);
        });
        return funcRegistry(o);
      },
    },
    register: {
      enumerable: false,
      value(key, args, fn) {
        if (typeof args === 'function') {
          fn = args;
          args = undefined;
        }
        if (args) {
          fn.args = args;
        }
        registry[key] = fn;
        // if (process.env.NODE_ENV !== 'production' && registry[key] !== fn) {
        //   throw new Error('Cannot register on a frozen animation builder');
        // }
        present[key] = new PresentFunction(function(...args) {
          clearNesting(args);
          return new PresentObject(bindDefinition(fn.call(this, ...args), fn, args));
        }, fn);
        PresentObject.prototype[key] =
          PresentFunction.prototype[key] =
          new PresentFunction(function(..._args) {
            const args = [this].concat(_args);
            clearNesting(args);
            return new PresentObject(bindDefinition(fn.call(this, ...args), fn, args));
          });
        return present[key];
      },
    },
    cast: {
      enumerable: false,
      value(fn) {
        return new PresentFunction(function(...args) {
          return new PresentFunction(fn.bind())();
        });
      },
    },
    context: {
      enumerable: false,
      value(fn) {
        return fn(present);
      },
    },
    freeze: {
      enumerable: false,
      value() {
        Object.freeze(registry);
        Object.freeze(present);
        Object.freeze(PresentFunction.prototype);
        Object.freeze(PresentObject.prototype);
        return present;
      },
    },
    disableBind: {
      enumerable: false,
      value() {
        autobind = false;
        return present;
      },
    },
  });

  let obj = fn;
  if (typeof fn === 'function') {
    obj = fn();
  }
  for (let key in obj) {
    present.register(key, obj[key].args, obj[key]);
  }

  return present;
};

module.exports = create;
module.exports.create = create;
