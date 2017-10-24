const _ast = require('./function-ast');
const astRegistry = require('./ast-registry');
const ast = astRegistry(_ast);
const math = require('./math-ast.inner');

const r = _ast.r;

const valueArgs = [['fn'], r('fn')];
const value = ast.context(({
  methods, func, call, r, l, read, eq
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
      eq(
        call(l(fn), [r('t'), r('state'), r('begin'), r('end')]),
        call(l(fn), [l(1), r('state'), r('begin'), r('end')])
      ),
    ]),
  })
)));
value.args = valueArgs;

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

const constantArgs = [['c'], r('c')];
const constant = ast.context(({
  func, l
}) => c => (
  lerp(func([], [l(c)]))
));
constant.args = constantArgs;

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

const beginArgs = [[]];
const begin = ast.context(() => () => at(0));
begin.args = beginArgs;

const endArgs = [[]];
const end = ast.context(() => () => at(1));
end.args = endArgs;

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
      // call(l('console.log'), [r('state')]),
      read('state'),
    ]),
    o: methods(obj),
    a: func(['b', 't', 'state', 'begin', 'end'], [
      for_of(obj, ['key', 'value'], [
        // store(r('state'), r('key'), l(1)),
        store(r('state'), r('key'),
          // call(lo(r('value'), l('a')), [
          //   r('value'),
          //   // lo(lo(r('b'), l('o')), r('key')),
          //   r('t'),
          //   lo(r('state'), r('key')),
          //   lo(r('begin'), r('key')),
          //   lo(r('end'), r('key')),
          // ])
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

const bezierArgs = [['fn', 'ax', 'ay', 'bx', 'by'], r('fn'), r('ax'), r('ay'), r('bx'), r('by')];
const bezier = ast.context(({
  func, call, r, l, w, methods,
}) => (fn, ax, ay, bx, by) => (
  easing(fn, func(['t'], [
    call(bezierBez, [call(bezierSearch, [r('t'), l(ax), l(bx)]), l(ay), l(by)]),
  ]))
));
bezier.args = bezierArgs;

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

const keyframes_exampleArgs = [[]];
const keyframes_example = () => duration(keyframes([
  seconds(0.999, object({opacity: constant(0)})),
  seconds(0.001, object({opacity: constant(1)})),
]), 1);
keyframes_example.args = keyframes_exampleArgs;

const object_to_exampleArgs = [[]];
const object_to_example = () => to(
  seconds(0.999, object({opacity: constant(0)})),
  seconds(0.001, object({opacity: constant(1)}))
);
object_to_example.args = object_to_exampleArgs;

const bezier_exampleArgs = [[]];
const bezier_example = () => to(
  object({
    opacity: bezier(constant(0), 0, 1, 1, 0),
    width: constant(100),
  }),
  object({
    opacity: constant(1),
    width: constant(200),
  })
);
bezier_example.args = bezier_exampleArgs;

const easeInOut_exampleArgs = [[]];
const easeInOut_example = () => to(
  object({
    opacity: easeInOut(constant(0)),
    width: bezier(constant(100), 0, 1, 1, 0),
  }),
  object({
    opacity: constant(1),
    width: constant(200),
  })
);
easeInOut_example.args = easeInOut_exampleArgs;

module.exports = {
  value,
  lerp,
  union,
  abs,
  add, sub, mul, div, mod, min, max, eq, ne, lt, lte, gt, gte,
  constant,
  at,
  begin,
  end,
  fromTo,
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
  keyframes_example,
  object_to_example,
  bezier_example,
  easeInOut_example,
  until: repeat,
  loop,
};
