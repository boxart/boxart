import 'babel-polyfill';

import create from './function-registry';

it('can be created with an object', () => {
  const builder = create({
    constant(c) {return () => c;},
  });
  expect(builder.constant).toBeInstanceOf(Function);
  expect(builder.constant(1)()).toBe(1);
});

it('can be created with a function', () => {
  const builder = create(() => ({
    constant(c) {return () => c;},
  }));
  expect(builder.constant).toBeInstanceOf(Function);
  expect(builder.constant(1)()).toBe(1);
});

it('can be extended with an object', () => {
  const builder = create({
    constant(c) {return () => c;},
  });
  const builder2 = builder.create({
    px(fn) {return () => fn() + 'px';},
  });
  expect(builder2.constant).toBeInstanceOf(Function);
  expect(builder2.px).toBeInstanceOf(Function);
  expect(builder2.constant(1)()).toBe(1);
  expect(builder2.px(builder2.constant(1))()).toBe('1px');
  expect(builder2.constant(1).px()()).toBe('1px');
});

it('can be extended with a function', () => {
  const builder = create(() => ({
    constant(c) {return () => c;},
  }));
  const builder2 = builder.create(() => ({
    px(fn) {return () => fn() + 'px';},
  }));
  expect(builder2.constant).toBeInstanceOf(Function);
  expect(builder2.px).toBeInstanceOf(Function);
  expect(builder2.constant(1)()).toBe(1);
  expect(builder2.px(builder2.constant(1))()).toBe('1px');
  expect(builder2.constant(1).px()()).toBe('1px');
});

it('has methods of their own function type', () => {
  const builder = create({
    constant(c) {return () => c;},
  });
  expect(Object.getPrototypeOf(builder.constant)).not.toBe(Function.prototype);
});

it('called methods return the same function type', () => {
  const builder = create({
    constant(c) {return () => c;},
  });
  expect(Object.getPrototypeOf(builder.constant))
    .toBe(Object.getPrototypeOf(builder.constant(1)));
});

it('has its own method type compared to another', () => {
  const builder = create({
    constant(c) {return () => c;},
  });
  const builder2 = builder.create({
    px(fn) {return () => fn() + 'px';},
  });
  expect(Object.getPrototypeOf(builder.constant))
    .not.toBe(Object.getPrototypeOf(builder2.constant));
});

it('can cast a method from one to another', () => {
  const builder = create({
    constant(c) {return () => c;},
  });
  const builder2 = builder.create({
    px(fn) {return () => fn() + 'px';},
  });
  // expect(builder2.cast(builder.constant(1))()).toBe(1);
  expect(Object.getPrototypeOf(builder2.cast(builder.constant(1))))
    .toBe(Object.getPrototypeOf(builder2.px));
});

it('can register new methods after initial creation', () => {
  const builder = create({
    constant(c) {return () => c;},
  });
  builder.register('px', fn => () => fn() + 'px');
  expect(builder.px).toBeInstanceOf(Function);
});

it('can freeze its object and function type from further changes', () => {
  const builder = create({
    constant(c) {return () => c;},
  });
  builder.freeze();
  expect(() => {
    builder.register('px', fn => () => fn() + 'px');
  }).toThrow(Error);
});

it('can take a constructor', () => {
  const constructor = function(fn) {return fn(builder)};
  const builder = create({
    constant(c) {return () => c;},
  }, constructor);
  expect(builder(({constant}) => constant(1)))
    .toBeInstanceOf(Object.getPrototypeOf(builder.constant).constructor);
});
