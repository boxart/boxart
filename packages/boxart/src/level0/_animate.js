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

const _ast = require('./function-ast');
const astRegistry = require('./ast-registry');
const ast = astRegistry(_ast).disableBind();
const math = require('./math');

const r = _ast.r;

/**
 * Create an animate function that calls the passed function argument with t,
 * state, begin, and end return its result.
 *
 * @function value
 */
const valueArgs = [['fn'], r('fn')];
const value = ast.context(({
  methods, func, call, r, l, read, eq, w, body,
}) => (fn => (
  methods({
    // (t, state, begin, end) => fn(t, state, begin, end)
    main: func(['t', 'state', 'begin', 'end'], [
      call(l(fn), [r('t'), r('state'), r('begin'), r('end')]),
    ]),
    // (a, t, state, begin, end) => fn(t, state, begin, end)
    a: func(['a', 't', 'state', 'begin', 'end'], [
      call(l(fn), [r('t'), r('state'), r('begin'), r('end')]),
    ]),
    // (t, state, begin, end) => fn(t, state, begin, end) == fn(1, state, begin, end)
    eq: func(['t', 'state', 'begin', 'end'], [
      // call(l(func(['a', 'b'], [eq(r('a'), r('b'))])), [
      //   call(l(fn), [r('t'), r('state'), r('begin'), r('end')]),
      //   call(l(fn), [l(1), r('state'), r('begin'), r('end')])
      // ]),
      eq(
        call(l(fn), [r('t'), r('state'), r('begin'), r('end')]),
        call(l(fn), [l(1), r('state'), r('begin'), r('end')])
      ),
    ]),
  })
)));
value.args = valueArgs;

/**
 * Create a function with the output of another animate call and a a-to-b
 * function to replace the a-to-b from the other animate call.
 *
 * @function a
 */
const aArgs = [['fn', 'afn'], r('fn'), r('afn')];
const a = ast.context(({
  methods, func, call, r, l, read, lo,
}) => ((fn, afn) => (
  methods({
    // (t, state, begin, end) => fn(t, state, begin, end)
    main: func(['t', 'state', 'begin', 'end'], [
      call(l(fn), [r('t'), r('state'), r('begin'), r('end')]),
    ]),
    // (a, t, state, begin, end) => fn(t, state, begin, end)
    a: func(['a', 't', 'state', 'begin', 'end'], [
      call(l(afn), [r('a'), r('t'), r('state'), r('begin'), r('end')]),
    ]),
    // (t, state, begin, end) => fn(t, state, begin, end) == fn(1, state, begin, end)
    eq: func(['t', 'state', 'begin', 'end'], [
      call(lo(l(fn), l('eq')), [r('t'), r('state'), r('begin'), r('end')]),
    ]),
  })
)));
a.args = aArgs;

/**
 * Create a function with the output of another animate call and an eq
 * when-animate-is-complete function to replace the eq from the other animate
 * call.
 *
 * @function done
 */
const doneArgs = [['fn', 'eqfn'], r('fn'), r('eqfn')];
const done = ast.context(({
  methods, func, call, r, l, read, lo,
}) => ((fn, donefn) => (
  methods({
    // (t, state, begin, end) => fn(t, state, begin, end)
    main: func(['t', 'state', 'begin', 'end'], [
      call(l(fn), [r('t'), r('state'), r('begin'), r('end')]),
    ]),
    // (a, t, state, begin, end) => fn(t, state, begin, end)
    a: func(['a', 't', 'state', 'begin', 'end'], [
      call(lo(l(fn), l('a')), [r('a'), r('t'), r('state'), r('begin'), r('end')]),
    ]),
    // (t, state, begin, end) => fn(t, state, begin, end) == fn(1, state, begin, end)
    eq: func(['t', 'state', 'begin', 'end'], [
      call(l(donefn), [r('t'), r('state'), r('begin'), r('end')]),
    ]),
  })
)));
done.args = doneArgs;

/**
 * Create an animate function that calls the passed function and returns the
 * result. It's a-to-b method calls the passed function and the b and
 * interpolates between them depending on `t`.
 *
 * @function lerp
 */
const lerpArgs = [['fn'], r('fn')];
const lerp = ast.context(({
  methods, func, call, l, r, write, add, mul, sub, min, gte
}) => (fn => (
  methods({
    main: func(['t', 'state', 'begin', 'end'], [
      call(l(fn), [r('t'), r('state'), r('begin'), r('end')]),
    ]),
    a: func(['a', 't', 'state', 'begin', 'end'], [
      // b = fn(t, state, begin, end)
      write('b', call(l(fn), [r('t'), r('state'), r('begin'), r('end')])),
      // e = a(t, state, begin, end)
      write('e', call(r('a'), [r('t'), r('state'), r('begin'), r('end')])),
      // (e - b) * Math.min(1, t) + b
      add(mul(sub(r('e'), r('b')), min(l(1), r('t'))), r('b')),
    ]),
    eq: func(['t', 'state', 'begin', 'end'], [gte(r('t'), l(1))]),
  })
)));
lerp.args = lerpArgs;

/**
 * Create an animate function that calls each function in the given array with
 * the same t, state, begin, and end values. This is useful to perform
 * different behaviours on the same object in the state's shape.
 *
 * @function union
 */
const unionArgs = [['set'], r('set')];
const union = ast.context(({
  methods, func, for_of, call, r, lo, w, l, branch, and,
}) => set => (
  methods({
    main: func(['t', 'state', 'begin', 'end'], [
      for_of(set, ['key', 'value'], [
        call(r('value'), [r('t'), r('state'), r('begin'), r('end')]),
      ]),
      r('state'),
    ]),
    set: methods(set),
    a: func(['a', 't', 'state', 'begin', 'end'], [
      for_of(set, ['key', 'value'], [
        call(
          lo(r('value'), l('a')),
          [
            lo(lo(r('a'), l('set')), r('key')),
            r('t'),
            r('state'),
            r('begin'),
            r('end'),
          ]
        ),
      ]),
      r('state'),
    ]),
    eq: func(['t', 'state', 'begin', 'end'], [
      w('result', l(true)),
      for_of(set, ['key', 'value'], [
        branch(and(r('result'), call(lo(r('value'), l('eq')), [
          r('t'),
          r('state'),
          r('begin'),
          r('end'),
        ])), [
          w('result', l(false)),
        ]),
      ]),
      r('result'),
    ]),
  })
));
union.args = unionArgs;

/**
 * Create a function that returns the absolute value of the returned result of
 * the passed function.
 *
 * @function abs
 */

/**
 * Create a function that returns the sumed value of the returned results of
 * the two passed functions.
 *
 * @function add
 */

/**
 * Create a function that returns the difference of the returned results of
 * the two passed functions.
 *
 * @function sub
 */

/**
 * Create a function that returns the multiplied value of the returned results
 * of the two passed functions.
 *
 * @function mul
 */

/**
 * Create a function that returns the divided value of the returned results of
 * the two passed functions.
 *
 * @function div
 */

/**
 * Create a function that returns the remainder of the divided of the returned
 * results of the two passed functions.
 *
 * @function mod
 */

/**
 * Create a function that returns the minimum value of the returned results of
 * the two passed functions.
 *
 * @function min
 */

/**
 * Create a function that returns the maximum value of the returned results of
 * the two passed functions.
 *
 * @function max
 */

/**
 * Create a function that returns whether the returned results of
 * the two passed functions are equivalent.
 *
 * @function eq
 */

/**
 * Create a function that returns whether the returned results of
 * the two passed functions are different.
 *
 * @function ne
 */

/**
 * Create a function that returns whether the returned result of
 * the first passed functions is less than the second passed function's result.
 *
 * @function lt
 */

/**
 * Create a function that returns whether the returned result of the first
 * passed functions is less than or equal to the second passed function's
 * result.
 *
 * @function lte
 */

/**
 * Create a function that returns whether the returned result of
 * the first passed functions is greater than the second passed function's
 * result.
 *
 * @function gt
 */

/**
 * Create a function that returns whether the returned result of the first
 * passed functions is greater than or equal to the second passed function's
 * result.
 *
 * @function gte
 */

const [
  abs,
  add, sub, mul, div, mod,
  min, max,
  eq, ne, lt, lte, gt, gte,
] = [
  'abs',
  'add', 'sub', 'mul', 'div', 'mod',
  'min', 'max',
  'eq', 'ne', 'lt', 'lte', 'gt', 'gte',
].map(ast.context(({l, r}) => op => (
  math[op](
    lerp,
    v => l(v),
    ['t', 'state', 'begin', 'end'],
    [r('t'), r('state'), r('begin'), r('end')]
  )
)));

/**
 * Create a function that returns the given constant value.
 *
 * @function constant
 */
const constantArgs = [['c'], r('c')];
const constant = ast.context(({
  func, l
}) => c => (
  lerp(func([], [l(c)]))
));
constant.args = constantArgs;

/**
 * Create a function that returns the passed t value.
 *
 * @function t
 */
const tArgs = [[]];
const t = ast.context(({
  methods, func, r, eq, l,
}) => () => (
  methods({
    // (t, state, begin, end) => t
    main: func(['t', 'state', 'begin', 'end'], [
      r('t'),
    ]),
    // (a, t, state, begin, end) => t
    a: func(['a', 't', 'state', 'begin', 'end'], [
      r('t'),
    ]),
    // (t, state, begin, end) => t == 1
    eq: func(['t', 'state', 'begin', 'end'], [
      eq(r('t'), l(1)),
    ]),
  })
));
t.args = tArgs;

/**
 * Create a function that returns the passed state value.
 *
 * @function state
 */
const stateArgs = [[]];
const state = ast.context(({
  methods, func, r, eq, l,
}) => () => (
  methods({
    // (t, state, begin, end) => state
    main: func(['t', 'state', 'begin', 'end'], [
      r('state'),
    ]),
    // (a, t, state, begin, end) => state
    a: func(['a', 't', 'state', 'begin', 'end'], [
      r('state'),
    ]),
    // (t, state, begin, end) => t == 1
    eq: func(['t', 'state', 'begin', 'end'], [
      eq(r('t'), l(1)),
    ]),
  })
));
state.args = stateArgs;

/**
 * Create a function that passes a value between the begin and end value based
 * on the given position (pos) value. A 0 position value is the begin value. A
 * 1 position value is the end value. Any value between 0 and 1 is
 * proprotionally positioned on the line between begin and end.
 *
 * @function at
 */
const atArgs = [['pos'], r('pos')];
const at = ast.context(({
  func, l, r, add, mul, sub
}) => pos => (
  lerp(func(['t', 'state', 'begin', 'end'], [
    // (end - begin) * pos + begin
    add(mul(sub(r('end'), r('begin')), l(pos)), r('begin'))
  ]))
));
at.args = atArgs;

/**
 * Create a function that returns the begin value.
 *
 * @function begin
 */
const beginArgs = [[]];
const begin = ast.context(() => () => at(0));
begin.args = beginArgs;

/**
 * Create a function that returns the end value.
 *
 * @function end
 */
const endArgs = [[]];
const end = ast.context(() => () => at(1));
end.args = endArgs;

/**
 * Create a function that returns the value portionally based on t between the
 * first and second function in the passed array.
 *
 * @function fromTo
 */
const fromToArgs = [['[a, b]'], [r('a'), r('b')]];
const fromTo = ast.context(({
  func, l, call, lo, r, methods
}) => ([a, b]) => methods({
  main: func(['t', 'state', 'begin', 'end'], [
    // a.a(b, t, state, begin, end)
    call(lo(l(a), l('a')), [l(b), r('t'), r('state'), r('begin'), r('end')]),
  ]),
  a: func(['a', 't', 'state', 'begin', 'end'], [
    // a.a(b, t, state, begin, end)
    call(lo(l(a), l('a')), [l(b), r('t'), r('state'), r('begin'), r('end')]),
  ]),
  eq: func(['t', 'state', 'begin', 'end'], [
    // b.eq(t, state, begin, end)
    call(lo(l(b), l('eq')), [r('t'), r('state'), r('begin'), r('end')]),
  ]),
}));
fromTo.args = fromToArgs;

/**
 * Create a function that calls the passed second argument with the key member
 * of the state, begin, and end values.
 *
 * @function get
 */
const getArgs = [['key', 'fn'], r('key'), r('fn')];
const get = ast.context(({
  methods, func, call, l, r, lo, or,
}) => (key, fn) => (
  methods({
    main: func(['t', 'state', 'begin', 'end'], [
      call(l(fn), [r('t'), lo(r('state'), l(key)), lo(r('begin'), l(key)), lo(r('end'), l(key))]),
    ]),
    a: func(['b', 't', 'state', 'begin', 'end'], [
      call(lo(l(fn), l('a')), [or(lo(r('b'), l('a')), r('b')), r('t'), lo(r('state'), l(key)), lo(r('begin'), l(key)), lo(r('end'), l(key))]),
    ]),
    eq: func(['t', 'state', 'begin', 'end'], [
      call(lo(l(fn), l('eq')), [r('t'), lo(r('state'), l(key)), lo(r('begin'), l(key)), lo(r('end'), l(key))]),
    ]),
  })
));
get.args = getArgs;

// const _withArgs = [['fn', 'key'], r('fn'), r('key')];
// const _with = (fn, key) => get(key, fn);
// _with.args = _withArgs;

/**
 * Create a function that sets the key's member of the state value with the
 * result of the called function.
 *
 * @function set
 */
const setArgs = [['k', 'fn'], r('k'), r('fn')];
const set = ast.context(({
  methods, func, st, r, l, call, lo, or, body,
}) => (key, fn) => (
  methods({
    main: func(['t', 'state', 'begin', 'end'], [
      st(
        r('state'),
        l(key),
        call(l(fn), [r('t'), r('state'), r('begin'), r('end')])
      ),
      r('state'),
    ]),
    fn: fn,
    a: func(['b', 't', 'state', 'begin', 'end'], [
      st(r('state'), l(key), call(lo(l(fn), l('a')), [or(lo(r('b'), l('fn')), r('b')), r('t'), r('state'), r('begin'), r('end')])),
      r('state'),
    ]),
    eq: func(['t', 'state', 'begin', 'end'], [
      call(lo(l(fn), l('eq')), [r('t'), r('state'), r('begin'), r('end')]),
    ]),
  })
));
set.args = setArgs;

/**
 * Create a function that iterates the given object's keys and values, setting
 * the state's key member by the called value function given the key member of
 * state, begin, and end.
 *
 * @function object
 */
const objectArgs = [['obj'], r('obj')];
const object = ast.context(({
  methods, func, l, lo, for_of, store, read, call, branch, literal, eq, load,
  r, write, w, and
}) => obj => (
  methods({
    main: func(['t', 'state', 'begin', 'end'], [
      // for (const [key, value] of Object.entries(obj))
      for_of(obj, ['key', 'value'], [
        // state[key] = value(t, state[key], begin[key], end[key])
        store(r('state'), r('key'),
          call(r('value'), [
            r('t'),
            lo(r('state'), r('key')),
            lo(r('begin'), r('key')),
            lo(r('end'), r('key')),
          ])
        ),
      ]),
      read('state'),
    ]),
    o: methods(obj),
    a: func(['b', 't', 'state', 'begin', 'end'], [
      for_of(obj, ['key', 'value'], [
        store(r('state'), r('key'),
          call(lo(r('value'), l('a')), [
            lo(lo(r('b'), l('o')), r('key')),
            r('t'),
            lo(r('state'), r('key')),
            lo(r('begin'), r('key')),
            lo(r('end'), r('key')),
          ])
        ),
      ]),
      read('state'),
    ]),
    eq: func(['t', 'state', 'begin', 'end'], [
      write('result', literal(true)),
      for_of(obj, ['key', 'value'], [
        branch(and(r('result'), call(lo(r('value'), l('eq')), [
          r('t'),
          lo(r('state'), r('key')),
          lo(r('begin'), r('key')),
          lo(r('end'), r('key')),
        ])), [
          w('result', l(false)),
        ]),
      ]),
      read('result'),
    ]),
  })
));
object.args = objectArgs;

/**
 * Create a function that calls the given function with every indexed member of
 * state, begin, and end.
 *
 * @function array
 */
const arrayArgs = [['fn'], r('fn')];
const array = ast.context(({
  methods, func, w, l, loop, lt, r, lo, call, branch, add, and,
}) => fn => (
  methods({
    main: func(['t', 'state', 'begin', 'end'], [
      w('i', l(0)),
      loop(lt(r('i'), lo(r('state'), l('length'))), [
        call(l(fn), [
          r('t'),
          lo(r('state'), r('i')),
          lo(r('begin'), r('i')),
          lo(r('end'), r('i')),
        ]),
        w('i', add(r('i'), l(1))),
      ]),
      branch(r('i'), []),
      r('state'),
    ]),
    fn: fn,
    a: func(['a', 't', 'state', 'begin', 'end'], [
      w('i', l(0)),
      loop(lt(r('i'), lo(r('state'), l('length'))), [
        call(lo(l(fn), l('a')), [
          lo(r('a'), l('fn')),
          r('t'),
          lo(r('state'), r('i')),
          lo(r('begin'), r('i')),
          lo(r('end'), r('i')),
        ]),
        w('i', add(r('i'), l(1))),
      ]),
      branch(r('i'), []),
      r('state'),
    ]),
    eq: func(['t', 'state', 'begin', 'end'], [
      w('result', l(true)),
      w('i', l(0)),
      loop(lt(r('i'), lo(r('state'), l('length'))), [
        branch(and(r('result'), call(lo(l(fn), l('eq')), [
          r('t'),
          lo(r('state'), r('i')),
          lo(r('begin'), r('i')),
          lo(r('end'), r('i')),
        ])), [
          w('result', l(false)),
        ]),
        w('i', add(r('i'), l(1))),
      ]),
      branch(r('i'), []),
      r('result'),
    ]),
  })
));
array.args = arrayArgs;

/**
 * Create a function that transforms t by one function and passing that into
 * the first function along with state, begin, and end.
 *
 * @function easing
 */
const easingArgs = [['fn', 'tfn'], r('fn'), r('tfn')];
const easing = ast.context(({
  methods, func, call, l, r, lo
}) => (fn, tfn) => (
  methods({
    main: func(['t', 'state', 'begin', 'end'], [
      call(l(fn), [
        call(l(tfn), [
          r('t'), r('state'), r('begin'), r('end')
        ]),
        r('state'),
        r('begin'),
        r('end'),
      ]),
    ]),
    a: func(['a', 't', 'state', 'begin', 'end'], [
      call(lo(l(fn), l('a')), [
        r('a'),
        call(l(tfn), [r('t'), r('state'), r('begin'), r('end')]),
        r('state'),
        r('begin'),
        r('end'),
      ]),
    ]),
    eq: func(['t', 'state', 'begin', 'end'], [
      call(lo(l(fn), l('eq')), [
        call(l(tfn), [r('t'), r('state'), r('begin'), r('end')]),
        r('state'),
        r('begin'),
        r('end'),
      ]),
    ]),
  })
));
easing.args = easingArgs;

/**
 * Create a function that calls the passed function with t transformed by a
 * cubic ease-in function.
 *
 * @function easeIn
 */
const easeInArgs = [['fn'], r('fn')];
const easeIn = ast.context(({
  func, mul, r, w,
}) => fn => (
  easing(fn, func(['t'], [
    w('t', mul(mul(r('t'), r('t')), r('t'))),
    r('t'),
  ]))
));
easeIn.args = easeInArgs;

/**
 * Create a function that calls the passed function with t transformed by a
 * cubic ease-out function.
 *
 * @function easeOut
 */
const easeOutArgs = [['fn'], r('fn')];
const easeOut = ast.context(({
  func, mul, r, sub, w, l, add,
}) => fn => (
  easing(fn, func(['t'], [
    w('t', sub(r('t'), l(1))),
    add(mul(mul(r('t'), r('t')), r('t')), l(1)),
  ]))
));
easeOut.args = easeOutArgs;

/**
 * Create a function that calls the passed function with t transformed by a
 * cubic ease-in-out function.
 *
 * @function easeInOut
 */
const easeInOutArgs = [['fn'], r('fn')];
const easeInOut = ast.context(({
  func, mul, r, add, sub, l, lt, branch, w,
}) => fn => (
  easing(fn, func(['t'], [
    w('out', r('t')),
    branch(lt(r('t'), l(0.5)), [
      w('out', mul(l(4), mul(mul(r('t'), r('t')), r('t'))))
    ], [
      w('out', add(
        mul(
          mul(
            sub(r('t'), l(1)),
            sub(mul(l(2), r('t')), l(2))
          ),
          sub(mul(l(2), r('t')), l(2))
        ),
        l(1)
      ))
    ]),
    r('out'),
  ]))
));
easeInOut.args = easeInOutArgs;

const bezierC = ast.context(({
  func, mul, l, r, w,
}) => (
  func(['x1', 'x2'], [
    mul(l(3), r('x1')),
  ])
));

const bezierB = ast.context(({
  func, sub, mul, l, r, w, call,
}) => (
  func(['x1', 'x2'], [
    // sub(mul(l(3), r('x2')), mul(l(6), r('x1'))),
    w('c', call(bezierC, [r('x1'), r('x2')])),
    sub(mul(l(3), sub(r('x2'), r('x1'))), r('c')),
  ])
));

const bezierA = ast.context(({
  func, sub, l, mul, r, w, call,
}) => (
  func(['x1', 'x2'], [
    // sub(sub(l(1), mul(l(3), r('x2'))), mul(l(3), r('x1'))),
    w('c', call(bezierC, [r('x1'), r('x2')])),
    w('b', call(bezierB, [r('x1'), r('x2')])),
    sub(sub(l(1), r('c')), r('b')),
  ])
));

const bezierBez = ast.context(({
  func, mul, r, add, call, w, l,
}) => (
  // t * (c(x1, x2) + t * (b(x1, x2) + t * a(x1, x2)));
  func(['t', 'x1', 'x2'], [
    w('c', call(bezierC, [r('x1'), r('x2')])),
    w('b', call(bezierB, [r('x1'), r('x2')])),
    w('a', call(bezierA, [r('x1'), r('x2')])),
    mul(
      r('t'),
      add(
        r('c'),
        mul(
          r('t'),
          add(
            r('b'),
            mul(
              r('t'),
              r('a')
            )
          )
        )
      )
    ),
  ])
));

const bezierDeriv = ast.context(({
  func, add, call, r, mul, l, w,
}) => (
  func(['t', 'x1', 'x2'], [
    // c(x1, x2) + t * (2 * b(x1, x2) + 3 * a(x1, x2) * t);
    w('c', call(bezierC, [r('x1'), r('x2')])),
    w('b', call(bezierB, [r('x1'), r('x2')])),
    w('a', call(bezierA, [r('x1'), r('x2')])),
    add(
      r('c'),
      mul(
        r('t'),
        add(
          mul(l(2), r('b')),
          mul(
            mul(l(3), r('a')),
            r('t')
          )
        )
      )
    )
  ])
));

const bezierSearch = ast.context(({
  func, w, r, l, call, loop, and, lt, gte, abs, sub, div, add, branch,
}) => (
  func(['t', 'x1', 'x2'], [
    w('x', r('t')),
    w('i', l(0)),
    w('z', sub(call(bezierBez, [r('x'), r('x1'), r('x2')]), r('t'))),
    loop(and(lt(r('i'), l(14)), gte(abs(r('z')), l(1e-3))), [
      w('x', sub(r('x'), div(r('z'), call(bezierDeriv, [r('x'), r('x1'), r('x2')])))),
      w('z', sub(call(bezierBez, [r('x'), r('x1'), r('x2')]), r('t'))),
      w('i', add(r('i'), l(1))),
    ]),
    branch(r('z'), []),
    branch(r('i'), []),
    r('x'),
  ])
));

/**
 * Create a function that calls the passed function with t transformed by a
 * cubic bezier function.
 *
 * @function bezier
 */
const bezierArgs = [['fn', 'ax', 'ay', 'bx', 'by'], r('fn'), r('ax'), r('ay'), r('bx'), r('by')];
const bezier = ast.context(({
  func, call, r, l, w, methods,
}) => (fn, ax, ay, bx, by) => (
  easing(fn, func(['t'], [
    call(bezierBez, [call(bezierSearch, [r('t'), l(ax), l(bx)]), l(ay), l(by)]),
  ]))
));
bezier.args = bezierArgs;

/**
 * Create a function that calls the passed function with t transformed by
 * dividing t by a given constant duration.
 *
 * @function duration
 */
const durationArgs = [['fn', 'duration'], r('fn'), r('duration')];
const duration = ast.context(({
  methods, func, call, l, r, lo, div, gte, mod,
}) => (fn, duration) => (
  methods({
    main: func(['t', 'state', 'begin', 'end'], [
      call(l(fn), [
        div(r('t'), l(duration)),
        r('state'),
        r('begin'),
        r('end')
      ]),
    ]),
    a: func(['a', 't', 'state', 'begin', 'end'], [
      call(lo(l(fn), l('a')), [
        r('a'),
        div(r('t'), l(duration)),
        r('state'),
        r('begin'),
        r('end')
      ]),
    ]),
    eq: func(['t', 'state', 'begin', 'end'], [
      gte(div(r('t'), l(duration)), l(1)),
    ]),
  })
));
duration.args = durationArgs;

/**
 * Creates a function that calls the passed function with t transformed by
 * using its remainder divided by a constant value.
 *
 * @function loop
 */
const loopArgs = [['fn', 'loop'], r('fn'), r('loop')];
const loop = ast.context(({
  methods, func, call, l, r, lo, div, gte, mod,
}) => (fn, loop) => (
  methods({
    main: func(['t', 'state', 'begin', 'end'], [
      call(l(fn), [
        mod(r('t'), l(loop)),
        r('state'),
        r('begin'),
        r('end')
      ]),
    ]),
    a: func(['a', 't', 'state', 'begin', 'end'], [
      call(lo(l(fn), l('a')), [
        r('a'),
        mod(r('t'), l(loop)),
        r('state'),
        r('begin'),
        r('end')
      ]),
    ]),
    eq: func(['t', 'state', 'begin', 'end'], [
      gte(mod(r('t'), l(loop)), l(1)),
    ]),
  })
));
loop.args = loopArgs;

/**
 * Creates a function that calls the passed function with until the until
 * function returns a value greater or than 1.
 *
 * @function repeat
 */
const repeatArgs = [['fn', 'until'], r('fn'), r('until')];
const repeat = ast.context(({
  methods, func, call, l, mod, div, r, lo, mul, gte, w,
}) => (fn, until) => (
  methods({
    main: func(['t', 'state', 'begin', 'end'], [
      call(l(fn), [
        r('t'),
        r('state'),
        r('begin'),
        r('end'),
      ]),
    ]),
    a: func(['a', 't', 'state', 'begin', 'end'], [
      call(lo(l(fn), l('a')), [
        r('a'),
        r('t'),
        r('state'),
        r('begin'),
        r('end'),
      ]),
    ]),
    eq: func(['t', 'state', 'begin', 'end'], [
      w('cmp', call(l(until), [r('t'), r('state'), r('begin'), r('end')])),
      gte(
        r('cmp'),
        l(1)
      ),
    ]),
  })
));
repeat.args = repeatArgs;

const toArgs = [['a', 'b'], r('a'), r('b')];
const to = ast.context(() => (
  (a, b) => fromTo([a, b])
));
to.args = toArgs;

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

const keyframesArgs = [['frames'], r('frames')];
const keyframes = ast.context(({
  methods, func, w, r, l, for_of, lo, sub, add, branch, call, not_last, lt, gte,
  lte, min, max, gt, and, or, mul,
}) => frames => (
  methods({
    main: func(['t', 'state', 'begin', 'end'], [
      // let sum = frames.reduce((a, b) => a + b.t(), 0);
      w('sum', call(l(func(['frames'], [
        w('s', l(0)),
        for_of(frames, ['_', 'value'], [
          w('s', add(r('s'), call(lo(r('value'), l('t')), []))),
        ]),
        r('s'),
      ])), [r('frames')])),
      // let out = state;
      w('out', r('state')),
      // let _t = Math.max(Math.min(t * sum), 1), 0);
      w('t', max(min(mul(r('t'), r('sum')), r('sum')), l(0))),
      // for (let [_, value] of Object.entries(frames)) {
      for_of(frames, ['_', 'value'], [
        // if (i > 0 && t < 0) {
        branch(and(gt(r('_for_of_index'), l(0)), lte(r('t'), l(0))), [
          // out = frames[i - 1].a(value, frames[i - 1].t() + t, state, begin, end);
          w('out', call(lo(lo(l(frames), sub(r('_for_of_index'), l(1))), l('a')), [
            r('value'),
            // or(lo(r('value'), l('fn')), r('value')),
            // r('value'),
            // func([], [l(0)]),
            // l(seconds(0.001, object({
            //   opacity: constant(1),
            // }))),
            add(r('t'), call(lo(lo(l(frames), sub(r('_for_of_index'), l(1))), l('t')), [])),
            // r('t'),
            r('state'),
            r('begin'),
            r('end'),
          ])),
          // _t += Infinity;
          w('t', add(r('t'), l(Infinity))),
        ], [
          // t -= value.t();
          w('t', sub(r('t'), call(lo(r('value'), l('t')), []))),
        ]),
      ]),
      // Hack around over-aggressive optimization that would get rid of some _t
      // assignments.
      branch(r('t'), []),
      // return out;
      r('out'),
    ]),
    a: func(['a', 't', 'state', 'begin', 'end'], [
      w('sum', call(l(func(['frames'], [
        w('s', l(0)),
        for_of(frames, ['_', 'value'], [
          w('s', add(r('s'), call(lo(r('value'), l('t')), []))),
        ]),
        r('s'),
      ])), [r('frames')])),
      w('out', r('state')),
      w('t', max(min(mul(r('t'), r('sum')), r('sum')), l(0))),
      for_of(frames, ['_', 'value'], [
        w('t', sub(r('t'), call(lo(r('value'), l('t')), []))),
        branch(lte(r('t'), l(0)), [
          w('out', call(lo(r('value'), l('a')), [
            // lo(l(frames), add(r('_for_of_index'), l(1))),
            // r('a'),
            or(
              lo(l(frames), add(r('_for_of_index'), l(1))),
              r('a')
            ),
            add(r('t'), call(lo(r('value'), l('t')), [])),
            r('state'),
            r('begin'),
            r('end'),
          ])),
          w('t', add(r('t'), l(Infinity))),
        ]),
      ]),
      branch(r('t'), []),
      r('out'),
    ]),
    eq: func(['t', 'state', 'begin', 'end'], [
      gte(r('t'), l(1)),
    ]),
  })
));
keyframes.args = keyframesArgs;

const frameArgs = [['timer', 'fn'], r('timer'), r('fn')];
const frame = ast.context(({
  methods, func, call, l, r, lo, or,
}) => (timer, fn) => (
  methods({
    main: func(['t', 'state', 'begin', 'end'], [
      call(l(fn), [
        call(l(timer), [r('t')]),
        r('state'),
        r('begin'),
        r('end'),
      ]),
    ]),
    a: func(['a', 't', 'state', 'begin', 'end'], [
      call(lo(l(fn), l('a')), [
        or(lo(r('a'), l('fn')), r('a')),
        call(l(timer), [r('t')]),
        r('state'),
        r('begin'),
        r('end'),
      ]),
    ]),
    fn: fn,
    t: func([], [
      call(lo(l(timer), l('t')), []),
    ]),
    eq: func(['t', 'state', 'begin', 'end'], [
      call(lo(l(fn), l('eq')), [
        call(l(timer), [r('t')]),
        r('state'),
        r('begin'),
        r('end'),
      ]),
    ]),
  })
));
frame.args = frameArgs;

const secondsArgs = [['seconds', 'fn'], r('seconds'), r('fn')];
const seconds = ast.context(({
  methods, func, div, r, l,
}) => (seconds, fn) => (
  frame(methods({
    main: func(['t'], [
      div(r('t'), l(seconds)),
    ]),
    t: func([], [l(seconds)]),
  }), fn)
));
seconds.args = secondsArgs;

const msArgs = [['ms', 'fn'], r('ms'), r('fn')];
const ms = ast.context(({
  methods, func, div, r, l, w,
}) => (ms, fn) => (
  frame(methods({
    main: func(['t'], [
      w('denom', div(l(ms), l(1000))),
      div(r('t'), r('denom')),
    ]),
    t: func([], [div(l(ms), l(1000))]),
  }), fn)
));
ms.args = msArgs;

const percentArgs = [['percent', 'fn'], r('percent'), r('fn')];
const percent = ast.context(({
  methods, func, div, r, l, w,
}) => (percent, fn) => (
  frame(methods({
    main: func(['t'], [
      w('denom', div(l(percent), l(100))),
      div(r('t'), r('denom')),
    ]),
    t: func([], [div(l(percent), l(100))]),
  }), fn)
));
percent.args = percentArgs;

module.exports = astRegistry({
  value,
  lerp,
  union,
  a,
  done,
  abs,
  add, sub, mul, div, mod, min, max, eq, ne, lt, lte, gt, gte,
  constant,
  t,
  state,
  at,
  begin,
  end,
  fromTo,
  get,
  set,
  object,
  array,
  easing,
  easeIn,
  easeOut,
  easeInOut,
  bezier,
  duration,
  to,
  keyframes,
  frame,
  seconds,
  ms,
  percent,
  until: repeat,
  loop,
});
