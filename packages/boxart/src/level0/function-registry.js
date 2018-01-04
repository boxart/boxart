const create = (fn, constructor = {}) => {
  function PresentFunction(f) {
    return Object.setPrototypeOf(f, PresentFunction.prototype);
  }
  PresentFunction.prototype = Object.create(Function.prototype);
  PresentFunction.prototype.constructor = PresentFunction;

  const registry = {};
  const present = constructor;
  Object.defineProperties(constructor, {
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
    register: {
      enumerable: false,
      value(key, fn) {
        registry[key] = fn;
        if (process.env.NODE_ENV !== 'production' && registry[key] !== fn) {
          throw new Error('Cannot register on a frozen animation builder');
        }
        present[key] = new PresentFunction(function(...args) {
          return new PresentFunction(fn.call(this, ...args));
        });
        PresentFunction.prototype[key] = new PresentFunction(function(...args) {
          return new PresentFunction(fn.call(this, this, ...args));
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
        return present;
      },
    },
    toString: {
      enumerable: false,
      value() {
        return `{${Object.entries(registry).map(([key, value]) => `${key}: ${String(value)}`).join(',\n')}}`;
      },
    },
  });

  let obj = fn;
  if (typeof fn === 'function') {
    obj = fn();
  }
  for (let key in obj) {
    present.register(key, obj[key]);
  }

  return present;
};

module.exports = create;
module.exports.create = create;
