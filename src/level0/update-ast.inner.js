const _ast = require('./function-ast');
const astRegistry = require('./ast-registry');
const ast = astRegistry(_ast);
const math = require('./math-ast.inner');

const r = _ast.r;

const valueArgs = [['fn'], r('fn')];
const value = ast.context(({
  methods, func, call, l, r
}) => fn => (
  methods({
    main: func(['element', 'state', 'animated'], [
      call(l(fn), [r('element'), r('state'), r('animated')]),
    ]),
    copy: fn.copy || fn.methods && fn.methods.copy || func(['dest', 'src'], [r('src')]),
  })
));
value.args = valueArgs;

const unionArgs = [['set'], r('set')];
const union = ast.context(({
  methods, func, for_of, call, r, lo, w, l, branch, and,
}) => set => (
  methods({
    main: func(['element', 'state', 'animated'], [
      for_of(set, ['key', 'value'], [
        w('state', call(r('value'), [r('element'), r('state'), r('animated')])),
      ]),
      r('state'),
    ]),
    copy: func(['dest', 'src'], [
      for_of(set, ['key', 'value'], [
        w('dest', call(lo(r('value'), l('copy')), [
          r('dest'), r('src'),
        ])),
      ]),
      r('dest'),
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
    value,
    v => l(v),
    ['element', 'state', 'animated'],
    [r('element'), r('state'), r('animated')]
  )
)));

const identityArgs = [[]];
const identity = ast.context(({
  func, r
}) => () => (
  value(func(['state'], [r('state')]))
));
identity.args = identityArgs;

const constantArgs = [['c'], r('c')];
const constant = ast.context(({
  func, l
}) => c => (
  value(func([], [l(c)]))
));
constant.args = constantArgs;

const propertyArgs = [['key'], r('key')];
const property = ast.context(({
  func, lo, r, l,
}) => key => (
  value(func(['element'], [lo(r('element'), l(key))]))
));
property.args = propertyArgs;

const walker = ast.context(({
  methods, func, w, r, or, l, for_of, st, call, lo
}) => (obj, _walk) => (
  methods({
    main: func(['element', 'state', 'animated'], _walk),
    copy: func(['dest', 'src'], [
      w('dest', or(r('dest'), l({}))),
      for_of(obj, ['key', 'value'], [
        st(
          r('dest'),
          r('key'),
          call(
            lo(r('value'), l('copy')),
            [
              lo(r('dest'), r('key')),
              lo(r('src'), r('key'))
            ]
          )
        ),
      ]),
      r('dest'),
    ]),
  })
));

const objectArgs = [['obj'], r('obj')];
const object = ast.context(({
  methods, func, w, r, or, l, for_of, st, call, lo
}) => obj => (
  walker(obj, [
    w('state', or(r('state'), l({}))),
    for_of(obj, ['key', 'value'], [
      st(r('state'), r('key'), call(
        r('value'),
        [
          r('element'),
          lo(r('state'), r('key')),
          r('animated'),
        ]
      )),
    ]),
    r('state'),
  ])
));
object.args = objectArgs;

const elementsArgs = [['obj'], r('obj')];
const elements = ast.context(({
  methods, func, w, r, or, l, for_of, st, call, lo, branch, ne, body,
}) => obj => (
  walker(obj, [
    w('state', or(r('state'), l({}))),
    w('rootElement', lo(
      lo(
        lo(r('animated'), l('animated')),
        l('root')
      ),
      l('element')
    )),
    for_of(obj, ['key', 'value'], [
      st(
        lo(r('animated'), l('animated')),
        r('key'),
        or(lo(lo(r('animated'), l('animated')), r('key')), l({}))
      ),
      branch(ne(r('key'), l('root')), [
        st(
          lo(
            lo(r('animated'), l('animated')),
            r('key')
          ),
          l('element'),
          lo(call(
            lo(
              r('rootElement'),
              l('getElementsByClassName')
            ),
            [r('key')]
          ), l(0)),
        ),
      ]),
      st(r('state'), r('key'), call(
        r('value'),
        [
          lo(lo(lo(r('animated'), l('animated')), r('key')), l('element')),
          lo(r('state'), r('key')),
          r('animated'),
        ]
      )),
      body([]),
    ]),
    r('state'),
  ])
));
elements.args = elementsArgs;

const elementArraysArgs = [['obj'], r('obj')];
const elementArrays = ast.context(({
  methods, func, w, r, or, l, for_of, st, call, lo, branch, body, loop, lt, add,
}) => obj => (
  methods({
    main: func(['element', 'state', 'animated'], [
      w('state', or(r('state'), l({}))),
      w('rootElement', lo(
        lo(
          lo(r('animated'), l('animated')),
          l('root')
        ),
        l('element')
      )),
      for_of(obj, ['key', 'value'], [
        // animated.animated[key] = animated.animated[key] || {}
        st(
          lo(r('animated'), l('animated')),
          r('key'),
          or(lo(lo(r('animated'), l('animated')), r('key')), l({}))
        ),
        // animated.animated[key].elements = animated.animated[key].elements || []
        st(
          lo(lo(r('animated'), l('animated')), r('key')),
          l('elements'),
          or(lo(lo(lo(r('animated'), l('animated')), r('key')), l('elements')), l([]))
        ),
        // animated.animated[key].elements.length = 0
        st(
          lo(lo(lo(r('animated'), l('animated')), r('key')), l('elements')),
          l('length'),
          l(0),
        ),
        // dest = animated.animated[key].elements
        w('dest', lo(lo(lo(r('animated'), l('animated')), r('key')), l('elements'))),
        // src = rootElement.getElementsByClassName(key)
        w('src', call(
          lo(
            r('rootElement'),
            l('getElementsByClassName')
          ),
          [r('key')]
        )),
        // state[key] = state[key] || []
        st(r('state'), r('key'), or(lo(r('state'), r('key')), l([]))),
        // _state = state[key]
        w('state2', lo(r('state'), r('key'))),
        // i = 0
        w('i', l(0)),
        // while (i < src.length) {
        loop(lt(r('i'), lo(r('src'), l('length'))), [
          // dest.push(src[i])
          call(lo(r('dest'), l('push')), [lo(r('src'), r('i'))]),
          // _state[i] = value(dest[i], _state[i], animated)
          st(r('state2'), r('i'), call(
            r('value'),
            [
              lo(r('dest'), r('i')),
              lo(r('state2'), r('i')),
              r('animated'),
            ]
          )),
          // i = i + 1
          w('i', add(r('i'), l(1))),
        ]),
        branch(r('i'), []),
        body([]),
      ]),
      r('state'),
    ]),
    copy: func(['dest', 'src'], [
      // _dest = dest || {}
      w('dest', or(r('dest'), l({}))),
      for_of(obj, ['key', 'value'], [
        // _dest[key] = _dest[key] || []
        st(r('dest'), r('key'), or(lo(r('dest'), r('key')), l([]))),
        // dest2 = _dest[key]
        w('dest2', lo(r('dest'), r('key'))),
        // _src = src[key]
        w('src2', lo(r('src'), r('key'))),
        // i = 0
        w('i', l(0)),
        loop(lt(r('i'), lo(r('src2'), l('length'))), [
          // dest2[i] = value.copy(dest2[i], src2[i])
          st(
            r('dest2'),
            r('i'),
            call(
              lo(r('value'), l('copy')),
              [
                lo(r('dest2'), r('i')),
                lo(r('src2'), r('i'))
              ]
            )
          ),
          // i = i + 1
          w('i', add(r('i'), l(1))),
        ]),
        branch(r('i'), []),
        body([]),
      ]),
      r('dest'),
    ]),
  })
));
elementArrays.args = elementArraysArgs;

const propertiesArgs = [['obj'], r('obj')];
const properties = ast.context(({
  methods, func, w, r, or, l, for_of, st, call, lo
}) => obj => (
  walker(obj, [
    // state = state || {};
    w('state', or(r('state'), l({}))),
    // for (const [key, value] of Object.entries(obj))
    for_of(obj, ['key', 'value'], [
      // state[key] = value(element[key], state, animated)
      st(r('state'), r('key'), call(
        r('value'),
        [
          lo(r('element'), r('key')),
          r('state'),
          r('animated'),
        ]
      )),
    ]),
    r('state'),
  ])
));
properties.args = propertiesArgs;

const asElementArgs = [['a', 'b'], r('a'), r('b')];
const asElement = ast.context(({
  methods, func, call, l, r, lo,
}) => (a, b) => (
  methods({
    main: func(['element', 'state', 'animated'], [
      // b(a(element, state, animated), state, animated)
      call(l(b), [call(l(a), [r('element'), r('state'), r('animated')]), r('state'), r('animated')]),
    ]),
    copy: func(['dest', 'src'], [
      call(lo(l(b), l('copy')), [r('dest'), r('src')]),
    ]),
  })
));
asElement.args = asElementArgs;

const rectCopyObj = {
  left: identity(),
  top: identity(),
  right: identity(),
  bottom: identity(),
  width: identity(),
  height: identity(),
};


const rectArgs = [[]];
const rect = ast.context(({
  methods, func, w, call, lo, r, l, st, add, or, for_of,
}) => () => (
  methods({
    main: func(['element', 'state'], [
      // _rect = element.getBoundingClientRect()
      w('_rect', call(lo(r('element'), l('getBoundingClientRect')), [])),
      // _scrollLeft = element.scrollLeft
      w('_scrollLeft', lo(r('element'), l('scrollLeft'))),
      // _scrollTop = element.scrollTop
      w('_scrollTop', lo(r('element'), l('scrollTop'))),
      // rect = state || {}
      w('rect', or(r('state'), l({}))),
      // rect.left = _rect.left + _scrollLeft
      st(r('rect'), l('left'), add(lo(r('_rect'), l('left')), r('_scrollLeft'))),
      // rect.top = _rect.top + _scrollTop
      st(r('rect'), l('top'), add(lo(r('_rect'), l('top')), r('_scrollTop'))),
      // rect.right = _rect.right + _scrollRight
      st(r('rect'), l('right'), add(lo(r('_rect'), l('right')), r('_scrollLeft'))),
      // rect.bottom = _rect.bottom + _scrollBottom
      st(r('rect'), l('bottom'), add(lo(r('_rect'), l('bottom')), r('_scrollTop'))),
      // rect.width = _rect.width
      st(r('rect'), l('width'), lo(r('_rect'), l('width'))),
      // rect.height = _rect.height
      st(r('rect'), l('height'), lo(r('_rect'), l('height'))),
      // call(l('console.log'), [r('rect')]),
      r('rect'),
    ]),
    copy: func(['dest', 'src'], [
      w('dest', or(r('dest'), l({}))),
      for_of(rectCopyObj, ['key', 'value'], [
        st(r('dest'), r('key'), lo(r('src'), r('key'))),
      ]),
      r('dest'),
    ]),
  })
));
rect.args = rectArgs;

const shouldArgs = [['fn', 'compare'], r('fn'), r('compare')];
const should = ast.context(({
  methods, func, call, l, r, lo
}) => (fn, compare) => (
  methods({
    main: func(['element', 'state', 'animated'], [
      call(l(fn), [r('element'), r('state'), r('animated')]),
    ]),
    copy: func(['dest', 'src'], [
      call(lo(lo(l(fn), l('methods')), l('copy')), [r('dest'), r('src')])
    ]),
    should: func(['a', 'b'], [
      call(l(compare), [r('a'), r('b')]),
    ]),
  })
));
should.args = shouldArgs;

module.exports = {
  value,
  union,
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
  byElement: asElement,
  rect,
  should,
};
