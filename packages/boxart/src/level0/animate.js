/**
 * `animate` functions manipulate a state object according to the inputs t,
 * state, begin, end. As an animation steps it will call its animate function
 * with a progressing `t` value commonly being the number of seconds divided by
 * the duration of the animation.
 *
 * t is a time interval unit ranging from values 0 to 1. 
 *
 * @module animate
 * @example
 * // Return the value for this function at point t (0 to 1) with the input
 * // state, begin, end. If state is an object the value can be set directly
 * // to a member of state. The update function will ensure that state, begin,
 * // and end, have the same shape and are defined.
 * function f(t, state, begin, end) {}
 * // Return the value for this function optionally considering function b to
 * // be the target destination at t = 1. Think of this function as from `a`
 * // to `b`.
 * f.a = function(b, t, state, begin, end) {}
 * // Return true if state has reached what this function considers to be the
 * // end. Some functions may think that is t >= 1. Some functions may think
 * // that is state === end.
 * f.eq = function(t, state, begin, end) {}
 */

const compileRegistry = require('./compile-registry');
const inlined = compileRegistry.inlined;

/**
 * Create an animate function that calls the passed function argument with t,
 * state, begin, and end return its result.
 *
 * @function value
 */
let value = inlined(function value(fn) {
  const f = function(t, state, begin, end, data) {
    return fn(t, state, begin, end, data);
  };
  return f;
});

/**
 * Create a function with the output of another animate call and a a-to-b
 * function to replace the a-to-b from the other animate call.
 *
 * @function a
 */
let toB = inlined(function toB(fn, toBFn) {
  const f = function(t, state, begin, end, data) {
    return fn(t, state, begin, end, data);
  };
  f.toB = function(b, t, state, begin, end, data) {
    return toBFn(b, t, state, begin, end, data);
  };
  return f;
});

/**
 * Create a function with the output of another animate call and an eq
 * when-animate-is-complete function to replace the eq from the other animate
 * call.
 *
 * @function done
 */
let done = inlined(function done(fn, doneFn) {
  const f = function(t, state, begin, end, data) {
    return fn(t, state, begin, end, data);
  };
  f.toB = function(b, t, state, begin, end, data) {
    return fn.toB ? fn.toB(b, t, state, begin, end, data) : fn(t, state, begin, end, data);
  };
  f.done = function(t, state, begin, end, data) {
    return doneFn(t, state, begin, end, data);
  };
  return f;
});

/**
 * Create an animate function that calls the passed function and returns the
 * result. It's a-to-b method calls the passed function and the b and
 * interpolates between them depending on `t`.
 *
 * @function lerp
 */
let lerp = inlined(function lerp(fn) {
  return done(
    toB(
      fn,
      function(b, t, state, begin, end, data) {
        const _b = fn(t, state, begin, end, data);
        const e = b(t, state, begin, end, data);
        return (e - _b) * Math.min(1, t) + _b;
      }
    ),
    function(t) {return t >= 1;}
  );
});

/**
 * Create an animate function that calls each function in the given array with
 * the same t, state, begin, and end values. This is useful to perform
 * different behaviours on the same object in the state's shape.
 *
 * @function union
 */
let union = inlined(function union(set) {
  const f = function(t, state, begin, end, data) {
    for (const value of Object.values(set)) {
      value(t, state, begin, end, data);
    }
    return state;
  };
  f.set = set;
  f.toB = function(b, t, state, begin, end, data) {
    let i = 0;
    for (const value of Object.values(set)) {
      value.toB(b.set[i], t, state, begin, end, data);
      i = i + 1;
    }
    return state;
  };
  f.done = function(t, state, begin, end, data) {
    let result = true;
    let i = 0;
    for (const value of Object.values(set)) {
      if (result && !value.done(t, state, begin, end, data)) {
        result = false;
      }
    }
    return result;
  };
  return f;
});

let unary = inlined(function unary(op, fn) {
  return value(function(t, state, begin, end, data) {
    return op(fn(t, state, begin, end, data));
  });
});

let binary = inlined(function binary(op, fn1, fn2) {
  return value(function(t, state, begin, end, data) {
    return op(fn1(t, state, begin, end, data), fn2(t, state, begin, end, data));
  });
});

/**
 * Create a function that returns the absolute value of the returned result of
 * the passed function.
 *
 * @function abs
 */
let abs = inlined(function abs(fn) {
  return unary(function(v) {return Math.abs(v);}, fn);
});

/**
 * Create a function that returns the sumed value of the returned results of
 * the two passed functions.
 *
 * @function add
 */
let add = inlined(function add(fn1, fn2) {
  return binary(function(a, b) {return a + b;}, fn1, fn2);
});

/**
 * Create a function that returns the difference of the returned results of
 * the two passed functions.
 *
 * @function sub
 */
let sub = inlined(function sub(fn1, fn2) {
  return binary(function(a, b) {return a - b;}, fn1, fn2);
});

/**
 * Create a function that returns the multiplied value of the returned results
 * of the two passed functions.
 *
 * @function mul
 */
let mul = inlined(function mul(fn1, fn2) {
  return binary(function(a, b) {return a * b;}, fn1, fn2);
});

/**
 * Create a function that returns the divided value of the returned results of
 * the two passed functions.
 *
 * @function div
 */
let div = inlined(function div(fn1, fn2) {
  return binary(function(a, b) {return a / b;}, fn1, fn2);
});

/**
 * Create a function that returns the remainder of the divided of the returned
 * results of the two passed functions.
 *
 * @function mod
 */
let mod = inlined(function mod(fn1, fn2) {
  return binary(function(a, b) {return a % b;}, fn1, fn2);
});

/**
 * Create a function that returns the minimum value of the returned results of
 * the two passed functions.
 *
 * @function min
 */
let min = inlined(function min(fn1, fn2) {
  return binary(function(a, b) {return Math.min(a, b);}, fn1, fn2);
});

/**
 * Create a function that returns the maximum value of the returned results of
 * the two passed functions.
 *
 * @function max
 */
let max = inlined(function max(fn1, fn2) {
  return binary(function(a, b) {return Math.max(a, b);}, fn1, fn2);
});

/**
 * Create a function that returns whether the returned results of
 * the two passed functions are equivalent.
 *
 * @function eq
 */
let eq = inlined(function eq(fn1, fn2) {
  return binary(function(a, b) {return a === b;}, fn1, fn2);
});

/**
 * Create a function that returns whether the returned results of
 * the two passed functions are different.
 *
 * @function ne
 */
let ne = inlined(function ne(fn1, fn2) {
  return binary(function(a, b) {return a !== b;}, fn1, fn2);
});

/**
 * Create a function that returns whether the returned result of
 * the first passed functions is less than the second passed function's result.
 *
 * @function lt
 */
let lt = inlined(function lt(fn1, fn2) {
  return binary(function(a, b) {return a < b;}, fn1, fn2);
});

/**
 * Create a function that returns whether the returned result of the first
 * passed functions is less than or equal to the second passed function's
 * result.
 *
 * @function lte
 */
let lte = inlined(function lte(fn1, fn2) {
  return binary(function(a, b) {return a <= b;}, fn1, fn2);
});

/**
 * Create a function that returns whether the returned result of
 * the first passed functions is greater than the second passed function's
 * result.
 *
 * @function gt
 */
let gt = inlined(function gt(fn1, fn2) {
  return binary(function(a, b) {return a > b;}, fn1, fn2);
});

/**
 * Create a function that returns whether the returned result of the first
 * passed functions is greater than or equal to the second passed function's
 * result.
 *
 * @function gte
 */
let gte = inlined(function gte(fn1, fn2) {
  return binary(function(a, b) {return a >= b;}, fn1, fn2);
});

/**
 * Create a function that returns the given constant value.
 *
 * @function constant
 */
let constant = inlined(function constant(c) {
  return value(function() {return c;});
});

/**
 * Create a function that returns the passed t value.
 *
 * @function t
 */
let t = inlined(function t() {
  return value(function(t) {return t;});
});

/**
 * Create a function that returns the passed state value.
 *
 * @function state
 */
let state = inlined(function state() {
  return value(function(t, state) {return state;});
});

/**
 * Create a function that passes a value between the begin and end value based
 * on the given position (pos) value. A 0 position value is the begin value. A
 * 1 position value is the end value. Any value between 0 and 1 is
 * proprotionally positioned on the line between begin and end.
 *
 * @function at
 */
let at = inlined(function at(pos) {
  return lerp(function(t, state, begin, end) {
    return (end - begin) * pos + begin;
  });
});

/**
 * Create a function that returns the begin value.
 *
 * @function begin
 */
let begin = inlined(function begin() {
  return at(0);
});

/**
 * Create a function that returns the end value.
 *
 * @function end
 */
let end = inlined(function end() {
  return at(1);
});

/**
 * Create a function that returns the value portionally based on t between the
 * first and second function in the passed array.
 *
 * @function to
 */
let to = inlined(function to(a, b) {
  return toB(function(t, state, begin, end, data) {
    return a.toB(b, t, state, begin, end, data);
  }, function(_b, t, state, begin, end, data) {
    return a.toB(_b, t, state, begin, end, data);
  });
});

/**
 * Create a function that calls the passed second argument with the key member
 * of the state, begin, and end values.
 *
 * @function get
 */
let get = inlined(function get(key, fn) {
  return value(function(t, state, begin, end, data) {
    return fn(t, state[key], begin[key], end[key], data);
  });
});

/**
 * Create a function that sets the key's member of the state value with the
 * result of the called function.
 *
 * @function set
 */
let set = inlined(function set(key, fn) {
  return value(function(t, state, begin, end, data) {
    state[key] = fn(t, state, begin, end, data);
    return state;
  });
});

/**
 * Create a function that iterates the given object's keys and values, setting
 * the state's key member by the called value function given the key member of
 * state, begin, and end.
 *
 * @function object
 */
let object = inlined(function object(obj) {
  const f = function(t, state, begin, end, data) {
    for (const [key, value] of Object.entries(obj)) {
      state[key] = value(t, state[key], begin[key], end[key], data);
    }
    return state;
  };
  f.obj = obj;
  f.toB = function(b, t, state, begin, end, data) {
    for (const [key, value] of Object.entries(obj)) {
      state[key] = value.toB(b.obj[key], t, state[key], begin[key], end[key], data);
    }
    return state;
  };
  return f;
});

/**
 * Create a function that calls the given function with every indexed member of
 * state, begin, and end.
 *
 * @function array
 */
let array = inlined(function array(fn) {
  return value(function(t, state, begin, end, data) {
    for (let i = 0; i < state.length; i++) {
      state[i] = fn(t, state[i], begin[i], end[i], data);
    }
    return state;
  });
});

/**
 * Create a function that transforms t by one function and passing that into
 * the first function along with state, begin, and end.
 *
 * @function easing
 */
let easing = inlined(function easing(fn, tfn) {
  return done(function(t, state, begin, end, data) {
    return fn(tfn(t, state, begin, end, data), state, begin, end, data);
  }, function(t, state, begin, end, data) {
    return tfn(t, state, begin, end, data) >= 1;
  });
});

/**
 * Create a function that calls the passed function with t transformed by a
 * cubic ease-in function.
 *
 * @function easeIn
 */
let easeIn = inlined(function easeIn(fn) {
  return easing(fn, function(t) {return t * t * t;});
});

/**
 * Create a function that calls the passed function with t transformed by a
 * cubic ease-out function.
 *
 * @function easeOut
 */
let easeOut = inlined(function easeOut(fn) {
  return easing(fn, function(t) {return (t - 1) * (t - 1) * (t - 1) + 1;});
});

/**
 * Create a function that calls the passed function with t transformed by a
 * cubic ease-in-out function.
 *
 * @function easeInOut
 */
let easeInOut = inlined(function easeInOut(fn) {
  return easing(fn, function(t) {
    let out;
    if (t < 0.5) {
      out = 4 * t * t * t;
    }
    else {
      out = (t - 1) * (t * 2 - 2) * (t * 2 - 2) + 1;
    }
    return out;
  });
});

// const bezierC = ast.context(({
//   func, mul, l, r, w,
// }) => (
//   func(['x1', 'x2'], [
//     mul(l(3), r('x1')),
//   ])
// ));
//
// const bezierB = ast.context(({
//   func, sub, mul, l, r, w, call,
// }) => (
//   func(['x1', 'x2'], [
//     // sub(mul(l(3), r('x2')), mul(l(6), r('x1'))),
//     w('c', call(bezierC, [r('x1'), r('x2')])),
//     sub(mul(l(3), sub(r('x2'), r('x1'))), r('c')),
//   ])
// ));
//
// const bezierA = ast.context(({
//   func, sub, l, mul, r, w, call,
// }) => (
//   func(['x1', 'x2'], [
//     // sub(sub(l(1), mul(l(3), r('x2'))), mul(l(3), r('x1'))),
//     w('c', call(bezierC, [r('x1'), r('x2')])),
//     w('b', call(bezierB, [r('x1'), r('x2')])),
//     sub(sub(l(1), r('c')), r('b')),
//   ])
// ));
//
// const bezierBez = ast.context(({
//   func, mul, r, add, call, w, l,
// }) => (
//   // t * (c(x1, x2) + t * (b(x1, x2) + t * a(x1, x2)));
//   func(['t', 'x1', 'x2'], [
//     w('c', call(bezierC, [r('x1'), r('x2')])),
//     w('b', call(bezierB, [r('x1'), r('x2')])),
//     w('a', call(bezierA, [r('x1'), r('x2')])),
//     mul(
//       r('t'),
//       add(
//         r('c'),
//         mul(
//           r('t'),
//           add(
//             r('b'),
//             mul(
//               r('t'),
//               r('a')
//             )
//           )
//         )
//       )
//     ),
//   ])
// ));
//
// const bezierDeriv = ast.context(({
//   func, add, call, r, mul, l, w,
// }) => (
//   func(['t', 'x1', 'x2'], [
//     // c(x1, x2) + t * (2 * b(x1, x2) + 3 * a(x1, x2) * t);
//     w('c', call(bezierC, [r('x1'), r('x2')])),
//     w('b', call(bezierB, [r('x1'), r('x2')])),
//     w('a', call(bezierA, [r('x1'), r('x2')])),
//     add(
//       r('c'),
//       mul(
//         r('t'),
//         add(
//           mul(l(2), r('b')),
//           mul(
//             mul(l(3), r('a')),
//             r('t')
//           )
//         )
//       )
//     )
//   ])
// ));
//
// const bezierSearch = ast.context(({
//   func, w, r, l, call, loop, and, lt, gte, abs, sub, div, add, branch,
// }) => (
//   func(['t', 'x1', 'x2'], [
//     w('x', r('t')),
//     w('i', l(0)),
//     w('z', sub(call(bezierBez, [r('x'), r('x1'), r('x2')]), r('t'))),
//     loop(and(lt(r('i'), l(14)), gte(abs(r('z')), l(1e-3))), [
//       w('x', sub(r('x'), div(r('z'), call(bezierDeriv, [r('x'), r('x1'), r('x2')])))),
//       w('z', sub(call(bezierBez, [r('x'), r('x1'), r('x2')]), r('t'))),
//       w('i', add(r('i'), l(1))),
//     ]),
//     branch(r('z'), []),
//     branch(r('i'), []),
//     r('x'),
//   ])
// ));
//
// /**
//  * Create a function that calls the passed function with t transformed by a
//  * cubic bezier function.
//  *
//  * @function bezier
//  */
// const bezierArgs = [['fn', 'ax', 'ay', 'bx', 'by'], r('fn'), r('ax'), r('ay'), r('bx'), r('by')];
// const bezier = ast.context(({
//   func, call, r, l, w, methods,
// }) => (fn, ax, ay, bx, by) => (
//   easing(fn, func(['t'], [
//     call(bezierBez, [call(bezierSearch, [r('t'), l(ax), l(bx)]), l(ay), l(by)]),
//   ]))
// ));
// bezier.args = bezierArgs;

/**
 * Create a function that calls the passed function with t transformed by
 * dividing t by a given constant duration.
 *
 * @function duration
 */
let duration = inlined(function duration(fn, length) {
  return easing(fn, function(t) {return t / length});
});

/**
 * Creates a function that calls the passed function with t transformed by
 * using its remainder divided by a constant value.
 *
 * @function loop
 */
let loop = inlined(function loop(fn, loop) {
  return easing(fn, function(t) {return t / loop % 1;});
});

/**
 * Creates a function that calls the passed function with until the until
 * function returns a value greater or than 1.
 *
 * @function repeat
 */
let repeat = inlined(function repeat(fn, until) {
  return done(fn, until);
});

// const keyframesSum = _frames => {
//   if (Array.isArray(_frames)) {
//
//   }
//   else {
//     let sum = 0;
//     return frames => {
//       if (sum === 0) {
//
//       }
//       return sum;
//     };
//   }
// };
let keyframes = inlined(function keyframes(frames) {
  const f = function(_t, state, begin, end, data) {
    const sum = (function(frames) {
      let s = 0;
      for (const value of frames) {
        s = s + value.t();
      }
      return s;
    })(frames);

    let out = state;
    let t = Math.max(Math.min(_t * sum, sum), 0);
    let i = 0;
    for (const value of frames) {
      if (i > 0 && t <= 0) {
        out = frames[i - 1].toB(value, t + frames[i - 1].t(), state, begin, end, data);
        t = t + Infinity;
      }
      else {
        t = t - value.t();
      }
      i = i + 1;
    }
    return out;
  };

  f.toB = function(b, _t, state, begin, end, data) {
    const sum = (function(frames) {
      let s = 0;
      for (const value of frames) {
        s = s + value.t();
      }
      return s;
    })(frames);

    let out = state;
    let t = Math.max(Math.min(_t * sum, sum), 0);
    let i = 0;
    for (const value of frames) {
      t = t - value.t();
      if (t <= 0) {
        out = value.toB(
          frames[i + 1] || b,
          t + value.t(),
          state,
          begin,
          end,
          data
        );
        t = t + Infinity;
      }
      i = i + 1;
    }
    return out;
  };

  return f;
});

let frame = inlined(function frame(timer, fn) {
  const f = function(t, state, begin, end, data) {
    return fn(timer(t), state, begin, end, data);
  };
  f.toB = function(b, t, state, begin, end, data) {
    let result;
    if (fn.toB) {
      result = fn.toB(b.fn || b, t, state, begin, end, data);
    }
    else {
      const _b = fn(t, state, begin, end, data);
      const e = b(t, state, begin, end, data);
      result = (e - _b) * Math.min(1, t) + _b;
    }
    return result;
  };
  f.t = function() {return timer.t();};
  f.fn = fn;
  return f;
});

let timer = inlined(function timer(unit) {
  const _timer = function(t) {return t / unit;};
  _timer.t = function() {return unit;};
  _timer.toB = null;
  _timer.done = null;
  return _timer;
});

let seconds = inlined(function seconds(seconds) {
  return timer(seconds);
});

let ms = inlined(function ms(ms) {
  return timer(ms / 1000);
});

let percent = inlined(function percent(percent) {
  return timer(percent / 100);
});

module.exports = compileRegistry({
  value,
  lerp,
  union,
  toB,
  done,
  unary,
  abs,
  binary,
  add, sub, mul, div, mod, min, max, eq, ne, lt, lte, gt, gte,
  constant,
  t,
  state,
  at,
  begin,
  end,
  to,
  get,
  set,
  object,
  array,
  easing,
  easeIn,
  easeOut,
  easeInOut,
  // bezier,
  duration,
  keyframes,
  frame,
  timer,
  seconds,
  ms,
  percent,
  until: repeat,
  loop,
});
