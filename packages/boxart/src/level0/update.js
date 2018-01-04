const compileRegistry = require('./compile-registry');
const inlined = compileRegistry.inlined;

let value = inlined(function value(fn) {
  const f = function(state, element, data) {
    return fn(state, element, data);
  };
  return f;
});

let union = inlined(function union(set) {
  const f = function(state, element, data) {
    for (const value of set) {
      state = value(state, element, data);
    }
    return state;
  };
  return f;
});

let unary = inlined(function unary(op, fn) {
  return value(function(state, element, data) {
    return op(fn(state, element, data));
  });
});

let binary = inlined(function binary(op, fn1, fn2) {
  return value(function(state, element, data) {
    return op(fn1(state, element, data), fn2(state, element, data));
  });
});

let abs = inlined(function abs(fn) {
  return unary(function(v) {return Math.abs(v);}, fn);
});

let add = inlined(function add(fn1, fn2) {
  return binary(function(a, b) {return a + b;}, fn1, fn2);
});

let sub = inlined(function sub(fn1, fn2) {
  return binary(function(a, b) {return a - b;}, fn1, fn2);
});

let mul = inlined(function mul(fn1, fn2) {
  return binary(function(a, b) {return a * b;}, fn1, fn2);
});

let div = inlined(function div(fn1, fn2) {
  return binary(function(a, b) {return a / b;}, fn1, fn2);
});

let mod = inlined(function mod(fn1, fn2) {
  return binary(function(a, b) {return a % b;}, fn1, fn2);
});

let min = inlined(function min(fn1, fn2) {
  return binary(function(a, b) {return Math.min(a, b);}, fn1, fn2);
});

let max = inlined(function max(fn1, fn2) {
  return binary(function(a, b) {return Math.max(a, b);}, fn1, fn2);
});

let eq = inlined(function eq(fn1, fn2) {
  return binary(function(a, b) {return a === b;}, fn1, fn2);
});

let ne = inlined(function ne(fn1, fn2) {
  return binary(function(a, b) {return a !== b;}, fn1, fn2);
});

let lt = inlined(function lt(fn1, fn2) {
  return binary(function(a, b) {return a < b;}, fn1, fn2);
});

let lte = inlined(function lte(fn1, fn2) {
  return binary(function(a, b) {return a <= b;}, fn1, fn2);
});

let gt = inlined(function gt(fn1, fn2) {
  return binary(function(a, b) {return a > b;}, fn1, fn2);
});

let gte = inlined(function gte(fn1, fn2) {
  return binary(function(a, b) {return a >= b;}, fn1, fn2);
});

let identity = inlined(function identity() {
  return value(function(state, element) {return element;});
});

let constant = inlined(function constant(c) {
  return value(function() {return c;});
});

let property = inlined(function property(key) {
  return value(function(state, element) {return element[key];});
});

let object = inlined(function object(obj) {
  const f = function(state, element, data) {
    state = state || {};
    for (const [key, value] of Object.entries(obj)) {
      state[key] = value(state[key], element, data);
    }
    return state;
  };
  return f;
});

let elements = inlined(function elements(obj) {
  const f = function(state, element, data) {
    state = state || {};
    const rootElement = data.animated.root.element;
    for (const [key, value] of Object.entries(obj)) {
      data.animated[key] = data.animated[key] || {};
      if (key !== 'root') {
        data.animated[key].element = rootElement.getElementsByClassName(key)[0];
      }
      state[key] = value(state[key], data.animated[key].element, data);
    }
    return state;
  };
  return f;
});

let elementArrays = inlined(function elementArrays(obj) {
  const f = function(state, element, data) {
    state = state || {};
    const rootElement = data.animated.root.element;
    for (const [key, value] of Object.entries(obj)) {
      data.animated[key] = data.animated[key] || {};
      data.animated[key].elements = data.animated[key].elements || [];
      data.animated[key].elements.length = 0;
      const elements = data.animated[key].elements;
      const children = rootElement.getElementsByClassName(key);
      const state2 = state[key] || [];
      state2.length = children.length;
      for (let i = 0; i < state2.length; i++) {
        elements.push(children[i]);
        state2[i] = value(state2[i], elements[i], data);
      }
      state[key] = state2;
    }
    return state;
  };
  return f;
});

let properties = inlined(function properties(obj) {
  const f = function(state, element, data) {
    state = state || {};
    for (const [key, value] of Object.entries(obj)) {
      state[key] = value(state, element[key], data);
    }
    return state;
  };
  return f;
});

let asElement = inlined(function asElement(a, b) {
  const f = function(state, element, data) {
    return b(state, a(state, element, data), data);
  };
  return f;
});

const rectCopyObj = {
  left: identity(),
  top: identity(),
  right: identity(),
  bottom: identity(),
  width: identity(),
  height: identity(),
};

let rect = inlined(function rect() {
  const f = function(state, element, data) {
    const _rect = element.getBoundingClientRect();
    const _scrollLeft = element.scrollLeft;
    const _scrollTop = element.scrollTop;
    const rect = state || {};
    rect.left = _rect.left + _scrollLeft;
    rect.top = _rect.top + _scrollTop;
    rect.right = _rect.right + _scrollLeft;
    rect.bottom = _rect.bottom + _scrollTop;
    rect.width = _rect.width;
    rect.height = _rect.height;
    return rect;
  };
  return f;
});

let should = inlined(function should(fn, compare) {
  const f = value(fn);
  f.should = function(a, b) {
    return compare(a, b);
  };
  return f;
});

module.exports = compileRegistry({
  value,
  union,
  unary, binary,
  abs,
  add, sub, mul, div, mod, min, max, eq, ne, lt, lte, gt, gte,
  identity,
  constant,
  property,
  object,
  elements,
  elementArrays,
  properties,
  asElement,
  rect,
  should,
});
