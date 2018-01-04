const compileRegistry = require('./compile-registry');
const inlined = compileRegistry.inlined;

let value = inlined(function value(fn) {
  const f = function(element, state, data) {
    return fn(element, state, data);
  };
  return f;
});

let union = inlined(function union(set) {
  const f = function(element, state, data) {
    for (const value of set) {
      value(element, state, data);
    }
    return element;
  };
  f.store = function(store, element, data) {
    for (const value of set) {
      if (value.store) {
        value.store(store, element, data);
      }
    }
    return store;
  };
  f.restore = function(element, store, data) {
    for (const value of set) {
      if (value.restore) {
        value.restore(element, store, data);
      }
    }
    return element;
  };
  return f;
});

let constant = inlined(function constant(c) {
  return value(function() {return c;});
});

let key = inlined(function key(key) {
  return value(function(element, state) {return state[key];});
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

let suffix = inlined(function suffix(fn, suffix) {
  return add(fn, function() {return suffix;});
});

let em = inlined(function em(fn) {
  return suffix(fn, 'em');
});

let percent = inlined(function percent(fn) {
  return suffix(fn, '%');
});

let deg = inlined(function deg(fn) {
  return suffix(fn, 'deg');
});

let rad = inlined(function rad(fn) {
  return suffix(fn, 'rad');
});

let px = inlined(function px(fn) {
  return suffix(fn, 'px');
});

let rem = inlined(function rem(fn) {
  return suffix(fn, 'rem');
});

let vh = inlined(function vh(fn) {
  return suffix(fn, 'vh');
});

let vmax = inlined(function vmax(fn) {
  return suffix(fn, 'vmax');
});

let vmin = inlined(function vmin(fn) {
  return suffix(fn, 'vmin');
});

let vw = inlined(function vw(fn) {
  return suffix(fn, 'vw');
});

let begin = inlined(function begin(fn) {
  return value(function(element, state, data) {
    return fn(element, data._begin || data.begin, data);
  });
});

let end = inlined(function end(fn) {
  return value(function(element, state, data) {
    return fn(element, data._end || data.end, data);
  });
});

let to = inlined(function to(a, b) {
  return value(function(element, state, data) {
    return sub(a, b(a))(element, state, data);
  });
});

let over = inlined(function over(a, b) {
  return value(function(element, state, data) {
    return div(a, b(a))(element, state, data);
  });
});

let concat = inlined(function concat(ary) {
  return value(function(element, state, data) {
    let s = '';
    for (const value of ary) {
      s = s + value(element, state, data);
    }
    return s;
  });
});

let func = inlined(function func(name, sep, ary) {
  return concat([
    constant(name),
    constant('('),
    value(function(element, state, data) {
      let s = '';
      let i = 0;
      for (const value of ary) {
        s = s + value(element, state, data);
        i = i + 1;
        if (i < ary.length) {
          s = s + sep;
        }
      }
      return s;
    }),
    constant(')'),
  ]);
});

let translate = inlined(function translate(ary) {
  return func('translate', ', ', ary);
});

let translatex = inlined(function translatex(ary) {
  return func('translatex', ', ', ary);
});

let translatey = inlined(function translatey(ary) {
  return func('translatey', ', ', ary);
});

let translatez = inlined(function translatez(ary) {
  return func('translatez', ', ', ary);
});

let translate3d = inlined(function translate3d(ary) {
  return func('translate3d', ', ', ary);
});

let rotate = inlined(function rotate(ary) {
  return func('rotate', ', ', ary);
});

let rotatex = inlined(function rotatex(ary) {
  return func('rotatex', ', ', ary);
});

let rotatey = inlined(function rotatey(ary) {
  return func('rotatey', ', ', ary);
});

let rotatez = inlined(function rotatez(ary) {
  return func('rotatez', ', ', ary);
});

let rotate3d = inlined(function rotate3d(ary) {
  return func('rotate3d', ', ', ary);
});

let scale = inlined(function scale(ary) {
  return func('scale', ', ', ary);
});

let scalex = inlined(function scalex(ary) {
  return func('scalex', ', ', ary);
});

let scaley = inlined(function scaley(ary) {
  return func('scaley', ', ', ary);
});

let scalez = inlined(function scalez(ary) {
  return func('scalez', ', ', ary);
});

let scale3d = inlined(function scale3d(ary) {
  return func('scale3d', ', ', ary);
});

let properties = inlined(function properties(obj) {
  const f = function(element, state, data) {
    for (const [key, value] of Object.entries(obj)) {
      value(element[key], state, data);
    }
    return element;
  };
  f.store = function(store, element, data) {
    store = store || {};
    for (const [key, value] of Object.entries(obj)) {
      if (value.store) {
        store[key] = value.store(store[key], element[key], data);
      }
    }
    return store;
  };
  f.restore = function(element, store, data) {
    for (const [key, value] of Object.entries(obj)) {
      if (value.restore) {
        value.restore(element[key], store[key], data);
      }
    }
    return element;
  };
  return f;
});

let fields = inlined(function fields(obj) {
  const f = function(element, state, data) {
    for (const [key, value] of Object.entries(obj)) {
      element[key] = value(element[key], state, data);
    }
    return element;
  };
  f.store = function(store, element, data) {
    store = store || {};
    for (const [key, value] of Object.entries(obj)) {
      if (value.store) {
        store[key] = value.store(store[key], element[key], data);
      }
    }
    return store;
  };
  f.restore = function(element, store, data) {
    for (const [key, value] of Object.entries(obj)) {
      if (value.restore) {
        element[key] = value.restore(element[key], store[key], data);
      }
    }
    return element;
  };
  return f;
});

let style = inlined(function style(obj) {
  return properties({style: fields(obj)});
});

let elements = inlined(function elements(obj) {
  const f = function(element, state, data) {
    for (const [key, value] of Object.entries(obj)) {
      const _begin = data._begin || data.begin;
      data._begin = _begin[key];
      const _end = data._end || data.end;
      data._end = _end[key];
      value(data.animated[key].element, state[key], data);
      data._begin = _begin;
      data._end = _end;
    }
    return element;
  };
  f.store = function(store, element, data) {
    store = store || {};
    for (const [key, value] of Object.entries(obj)) {
      store[key] = value.store(store[key], data.animated[key].element, data);
    }
    return store;
  };
  f.restore = function(element, store, data) {
    for (const [key, value] of Object.entries(obj)) {
      value.restore(data.animated[key].element, store[key], data);
    }
    return element;
  };
  return f;
});

let elementArrays = inlined(function elementArrays(obj) {
  const f = function(element, state, data) {
    for (const [key, value] of Object.entries(obj)) {
      const _begin = data._begin || data.begin;
      data._begin = _begin[key];
      const _end = data._end || data.end;
      data._end = _end[key];
      const elements = data.animated[key].elements;
      const state2 = state[key];
      const _begin2 = _begin[key];
      const _end2 = _end[key];
      for (let i = 0; i < elements.length; i++) {
        data._begin = _begin2[i];
        data._end = _end2[i];
        value(elements[i], state2[i], data);
      }
      data._begin = _begin;
      data._end = _end;
    }
    return element;
  };
  f.store = function(store, element, data) {
    store = store || {};
    for (const [key, value] of Object.entries(obj)) {
      const elements = data.animated[key].elements;
      store[key] = store[key] || [];
      const store2 = store[key];
      for (let i = 0; i < elements.length; i++) {
        store2[i] = value.store(store2[i], elements[i], data);
      }
      store2.length = elements.length;
    }
    return store;
  };
  f.restore = function(element, store, data) {
    for (const [key, value] of Object.entries(obj)) {
      const elements = data.animated[key].elements;
      const store2 = store[key];
      for (let i = 0; i < elements.length; i++) {
        value.restore(elements[i], store2[i], data);
      }
    }
    return element;
  };
  return f;
});

let object = inlined(function object(obj) {
  const f = function(element, state, data) {
    for (const [key, value] of Object.entries(obj)) {
      const _begin = data._begin || data.begin;
      data._begin = _begin[key];
      const _end = data._end || data.end;
      data._end = _end[key];
      value(element, state[key], data);
      data._begin = _begin;
      data._end = _end;
    }
    return element;
  };
  f.store = function(store, element, data) {
    for (const [key, value] of Object.entries(obj)) {
      if (value.store) {
        value.store(store, element, data);
      }
    }
    return store;
  };
  f.restore = function(element, store, data) {
    for (const [key, value] of Object.entries(obj)) {
      if (value.restore) {
        value.restore(element, store, data);
      }
    }
    return element;
  };
  return f;
});

module.exports = compileRegistry({
  value,
  union,
  constant,
  key,
  suffix,
  em, percent, deg, rad, px, rem, vh, vmax, vmin, vw,
  unary,
  binary,
  abs,
  add, sub, mul, div,
  mod, min, max, eq, ne, lt, lte, gt, gte,
  begin, end, to, over,
  concat,
  func,
  translate, translatex, translatey, translatez, translate3d,
  rotate, rotatex, rotatey, rotatez, rotate3d,
  scale, scalex, scaley, scalez, scale3d,
  properties,
  fields,
  style,
  elements,
  elementArrays,
  object,
});
