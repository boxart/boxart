const compile = require('./function.babel.compile').default;
const funcRegistry = require('./function-registry');

const lazyCompile = (fn, registry) => {
  fn._compiled = fn._compiled || compile(fn, registry)();
  return fn._compiled;
};

const lazyCall = (fn, registry) => (...args) => {
  return lazyCompile(fn, registry)(...args);
};

const lazyKeyCall = (fn, key, registry) => (...args) => {
  return lazyCompile(fn, registry)[key](...args);
};

const clearNesting = args => {
  args.forEach(a => {
    if (typeof a === 'function' && !(a instanceof Function)) {
      Object.setPrototypeOf(a, Function.prototype);
    }
  });
};

function bindDefinition(fn, autobind, registry, origin, args) {
  if (!autobind) {return fn;}
  try {
    const wrapped = Object.assign(lazyCall(fn), fn);
    // Object.defineProperty(fn, 'meta', {
    //   value: {origin, args, meta: fn.meta},
    //   enumerable: false,
    // });
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

function inlined(fn, registry) {
  const f = function(...args) {
    clearNesting(args);
    return bindDefinition(fn.call(this, ...args), true, registry, fn, args);
  };
  f.__boxart_inlined = fn;
  return f;
}

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

  PresentFunction.prototype.toString = function() {
    return this.asfunc().toString();
  };

  function PresentObject(f) {
    return Object.setPrototypeOf(f, PresentObject.prototype);
  }
  PresentObject.prototype = Object.create(Object.prototype);
  PresentObject.prototype.constructor = PresentObject;

  PresentObject.prototype.compile = function() {
    return compile(this, registry)();
  };
  PresentObject.prototype.toString = function() {
    return this.compile(this).toString();
  };

  let autobind = true;
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
        if (fn.__boxart_inlined) {
          fn = fn.__boxart_inlined;
        }
        registry[key] = fn;
        // if (process.env.NODE_ENV !== 'production' && registry[key] !== fn) {
        //   throw new Error('Cannot register on a frozen animation builder');
        // }
        present[key] = new PresentFunction(function(...args) {
          clearNesting(args);
          return new PresentObject(bindDefinition(fn.call(this, ...args), autobind, registry, fn, args));
        }, fn);
        PresentObject.prototype[key] =
          PresentFunction.prototype[key] =
          new PresentFunction(function(..._args) {
            const args = [this].concat(_args);
            clearNesting(args);
            return new PresentObject(bindDefinition(fn.call(this, ...args), autobind, registry, fn, args));
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
    registry: {
      enumerable: false,
      value() {
        return Object.freeze(Object.assign({}, registry));
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
module.exports.inlined = inlined;
