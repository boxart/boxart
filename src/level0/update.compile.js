const compileRegistry = require('./compile-registry');

function value(fn) {
  const f = function(state, element, data) {
    return fn(state, element, data);
  };
  return f;
}

function union(set) {
  const f = function(state, element, data) {
    for (const value of set) {
      state = value(state, element, data);
    }
    return state;
  };
  return f;
}

function unary(op) {
  return function(fn) {
    return value(function(state, element, data) {
      return op(fn(state, element, data));
    });
  };
}

function binary(op) {
  return function(fn1, fn2) {
    return value(function(state, element, data) {
      return op(fn1(state, element, data), fn2(state, element, data));
    })
  };
}

function abs(fn) {
  return unary(function(v) {return Math.abs(v);})(fn);
}

function add(fn1, fn2) {
  return binary(function(a, b) {return a + b;})(fn1, fn2);
}

function sub(fn1, fn2) {
  return binary(function(a, b) {return a - b;})(fn1, fn2);
}

function mul(fn1, fn2) {
  return binary(function(a, b) {return a * b;})(fn1, fn2);
}

function div(fn1, fn2) {
  return binary(function(a, b) {return a / b;})(fn1, fn2);
}

function mod(fn1, fn2) {
  return binary(function(a, b) {return a % b;})(fn1, fn2);
}

function min(fn) {
  return unary(function(v) {return Math.min(v);})(fn);
}

function max(fn) {
  return unary(function(v) {return Math.max(v);})(fn);
}

function eq(fn1, fn2) {
  return binary(function(a, b) {return a === b;})(fn1, fn2);
}

function ne(fn1, fn2) {
  return binary(function(a, b) {return a !== b;})(fn1, fn2);
}

function lt(fn1, fn2) {
  return binary(function(a, b) {return a < b;})(fn1, fn2);
}

function lte(fn1, fn2) {
  return binary(function(a, b) {return a <= b;})(fn1, fn2);
}

function gt(fn1, fn2) {
  return binary(function(a, b) {return a > b;})(fn1, fn2);
}

function gte(fn1, fn2) {
  return binary(function(a, b) {return a >= b;})(fn1, fn2);
}

function identity() {
  return value(function(state, element) {return element;});
}

function constant(c) {
  return value(function() {return c;});
}

function property(key) {
  return value(function(state, element) {return element[key];});
}

function object(obj) {
  const f = function(state, element, data) {
    state = state || {};
    for (const [key, value] of Object.entries(obj)) {
      state[key] = value(state[key], element, data);
    }
    return state;
  };
  return f;
}

function elements(obj) {
  const f = function(state, element, data) {
    state = state || {};
    const rootElement = data.data.root.element;
    for (const [key, value] of Object.entries(obj)) {
      data.data[key] = data.data[key] || {};
      if (key !== 'root') {
        data.data[key].element = rootElement.getElementsByClassName(key)[0];
      }
      state[key] = value(state[key], data.data[key].element, data);
    }
    return state;
  };
  return f;
}

function elementArrays(obj) {
  const f = function(state, element, data) {
    state = state || {};
    const rootElement = data.data.root.element;
    for (const [key, value] of Object.entries(obj)) {
      data.data[key] = data.data[key] || {};
      data.data[key].elements = data.data[key].elements || [];
      data.data[key].elements.length = 0;
      const elements = data.data[key].elements;
      const children = rootElement.getElementsByClassName(key);
      state[key] = state[key] || [];
      for (let i = 0; i < children.length; i++) {
        elements.push(children[i]);
        state[key][i] = value(state[key][i], elements[i], data);
      }
    }
    return state;
  };
  return f;
}

function properties(obj) {
  const f = function(state, element, data) {
    state = state || {};
    for (const [key, value] of Object.entries(obj)) {
      state[key] = value(state, element[key], data);
    }
    return state;
  };
  return f;
}

function asElement(a, b) {
  const f = function(state, element, data) {
    return b(state, a(state, element, data), data);
  };
  return f;
}

const rectCopyObj = {
  left: identity(),
  top: identity(),
  right: identity(),
  bottom: identity(),
  width: identity(),
  height: identity(),
};

function rect() {
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
}

function should(fn, compare) {
  const f = value(fn);
  f.should = function(a, b) {
    return compare(a, b);
  };
  return f;
}

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
