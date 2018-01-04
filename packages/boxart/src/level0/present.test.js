import {
  concat,
  key,
  object,
  path,
  properties,
  px,
  translate,
  value,
} from './present';

it('value(state => state.left)', () => {
  expect(value(state => state.left)({}, {left: 1}, {})).toBe(1);
});

it('value(state => state.left).store', () => {
  expect(value(state => state.left).store(0, 1)).toBe(1);
});

it('value(state => state.left).restore', () => {
  expect(value(state => state.left).restore(0, 1)).toBe(1);
});

it('px(value(state => state.left))', () => {
  expect(px(value(state => state.left))({}, {left: 1}, {})).toBe('1px');
});

it('value(state => state.left).px()', () => {
  expect(value(state => state.left).px()({}, {left: 1}, {})).toBe('1px');
});

it('key("left")', () => {
  expect(key('left')({}, {left: 1}, {})).toBe(1);
});

it('key("left").px()', () => {
  expect(key('left').px()({}, {left: 1}, {})).toBe('1px');
});

it('path(["leg", "left"])', () => {
  expect(path(['leg', 'left'])({}, {leg: {left: 1}}, {})).toBe(1);
});

it('concat(state => [state.left, " ", state.top])', () => {
  expect(concat(state => [state.left, ' ', state.top])({}, {left: 1, top: 2}, {})).toBe('1 2');
});

it('concat([state => state.left, " ", state => state.top])', () => {
  expect(concat([state => state.left, ' ', state => state.top])({}, {left: 1, top: 2}, {})).toBe('1 2');
});

it('translate(state => [state.left, state.top])', () => {
  expect(translate(state => [state.left, state.top])({}, {left: 1, top: 2}, {})).toBe('translate(1, 2)');
});

it('translate([state => state.left, state => state.top])', () => {
  expect(translate([state => state.left, state => state.top])({}, {left: 1, top: 2}, {})).toBe('translate(1, 2)');
});

it('translate([key("left"), key("top")])', () => {
  expect(translate([key('left'), key('top')])({}, {left: 1, top: 2}, {})).toBe('translate(1, 2)');
});

it('translate([key("left").px(), key("top").px()])', () => {
  expect(translate([key('left').px(), key('top').px()])({}, {left: 1, top: 2}, {})).toBe('translate(1px, 2px)');
});

it('properties({src: key("src")})', () => {
  expect(properties({src: key('src')})({src: ''}, {src: 'abc'}, {}).src).toBe('abc');
});

it('properties({src: key("src")}).store', () => {
  expect(properties({src: key('src')}).store({}, {src: 'abc'}, {}).src).toBe('abc');
});

it('properties({src: key("src")}).restore', () => {
  expect(properties({src: key('src')}).restore({}, {src: 'abc'}, {}).src).toBe('abc');
});

it('object({leg: properties({src: key("src")})})', () => {
  expect(object({leg: properties({src: key('src')})})({}, {leg: {src: 'abc'}}, {}).src).toBe('abc');
});

it('object({leg: properties({src: key("src")})}).store', () => {
  expect(object({leg: properties({src: key('src')})}).store({}, {src: 'abc'}, {}).src).toBe('abc');
});

it('object({leg: properties({src: key("src")})}).restore', () => {
  expect(object({leg: properties({src: key('src')})}).restore({}, {src: 'abc'}, {}).src).toBe('abc');
});
