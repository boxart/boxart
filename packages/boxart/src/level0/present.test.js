import present, {
  concat,
  key,
  object,
  path,
  fields,
  px,
  translate,
  value,
} from './present';

it('value((e, state) => state.left)', () => {
  expect(value((e, state) => state.left)({}, {left: 1}, {})).toBe(1);
});

it('value((e, state) => state.left).store', () => {
  expect(value((e, state) => state.left).store(0, 1)).toBe(1);
});

it('value((e, state) => state.left).restore', () => {
  expect(value((e, state) => state.left).restore(0, 1)).toBe(1);
});

it('px(value((e, state) => state.left))', () => {
  expect(px(value((e, state) => state.left))({}, {left: 1}, {})).toBe('1px');
});

it('value((e, state) => state.left).px()', () => {
  expect(value((e, state) => state.left).px()({}, {left: 1}, {})).toBe('1px');
});

it('key("left")', () => {
  expect(key('left')({}, {left: 1}, {})).toBe(1);
});

it('key("left").px()', () => {
  expect(key('left').px()({}, {left: 1}, {})).toBe('1px');
});

it.skip('path(["leg", "left"])', () => {
  expect(path(['leg', 'left'])({}, {leg: {left: 1}}, {})).toBe(1);
});

it('concat([(e, state) => state.left, () => " ", (e, state) => state.top])', () => {
  expect(concat([(e, state) => state.left, () => ' ', (e, state) => state.top])({}, {left: 1, top: 2}, {})).toBe('1 2');
});

it('translate([(e, state) => state.left, (e, state) => state.top])', () => {
  expect(translate([(e, state) => state.left, (e, state) => state.top])({}, {left: 1, top: 2}, {})).toBe('translate(1, 2)');
});

it('translate([key("left"), key("top")])', () => {
  expect(translate([key('left'), key('top')])({}, {left: 1, top: 2}, {})).toBe('translate(1, 2)');
});

it('translate([key("left").px(), key("top").px()])', () => {
  expect(translate([key('left').px(), key('top').px()])({}, {left: 1, top: 2}, {})).toBe('translate(1px, 2px)');
});

it('fields({src: key("src")})', () => {
  expect(fields({src: key('src')})({src: ''}, {src: 'abc'}, {}).src).toBe('abc');
});

it('fields({src: key("src")}).store', () => {
  expect(fields({src: key('src')}).store({}, {src: 'abc'}, {}).src).toBe('abc');
});

it('fields({src: key("src")}).restore', () => {
  expect(fields({src: key('src')}).restore({}, {src: 'abc'}, {}).src).toBe('abc');
});

it('object({leg: fields({src: key("src")})})', () => {
  expect(object({leg: fields({src: key('src')})})({}, {leg: {src: 'abc'}}, {begin: {leg: {src: 'abc'}}, end: {leg: {src: 'abc'}}}).src).toBe('abc');
});

it('object({leg: fields({src: key("src")})}).store', () => {
  expect(object({leg: fields({src: key('src')})}).store({}, {src: 'abc'}, {}).src).toBe('abc');
});

it('object({leg: fields({src: key("src")})}).restore', () => {
  expect(object({leg: fields({src: key('src')})}).restore({}, {src: 'abc'}, {}).src).toBe('abc');
});
