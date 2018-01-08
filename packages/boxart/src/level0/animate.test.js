import {at, to, object} from './animate';

it('at(0)', () => {
  expect(at(0)(0, 0, 0, 1)).toBe(0);
});

it('at(0.5)', () => {
  expect(at(0.5)(0, 0, 0, 1)).toBe(0.5);
});

it('at(1)', () => {
  expect(at(1)(0, 0, 0, 1)).toBe(1);
});

it('at(0).toB', () => {
  expect(at(0).toB(at(1), 0, 0, 0, 1)).toBe(0);
});

it('at(0).toB', () => {
  expect(at(0).toB(at(1), 0.5, 0, 0, 1)).toBe(0.5);
});

it('at(0).toB', () => {
  expect(at(0).toB(at(1), 1, 0, 0, 1)).toBe(1);
});

it('at(0).toB', () => {
  expect(at(0).toB(at(0.5), 1, 0, 0, 1)).toBe(0.5);
});

it('at(0.5).toB', () => {
  expect(at(0.5).toB(at(1), 0, 0, 0, 1)).toBe(0.5);
});

it('at(1).toB', () => {
  expect(at(1).toB(at(0), 0, 0, 0, 1)).toBe(1);
});

it('at(1).toB', () => {
  expect(at(1).toB(at(0), 1, 0, 0, 1)).toBe(0);
});

it('to(at(0), at(1))', () => {
  expect(to(at(0), at(1))(0, 0, 0, 1)).toBe(0);
});

it('to(at(0), at(1))', () => {
  expect(to(at(0), at(1))(0.5, 0, 0, 1)).toBe(0.5);
});

it('to(at(0), at(1))', () => {
  expect(to(at(0), at(1))(1, 0, 0, 1)).toBe(1);
});

it('to(at(0), at(0.5))', () => {
  expect(to(at(0), at(0.5))(1, 0, 0, 1)).toBe(0.5);
});

it('to(at(0.5), at(1))', () => {
  expect(to(at(0.5), at(1))(0, 0, 0, 1)).toBe(0.5);
});

it('to(at(1), at(0))', () => {
  expect(to(at(1), at(0))(0, 0, 0, 1)).toBe(1);
});

it('object({a: to(at(0), at(1))})', () => {
  expect(object({a: to(at(0), at(1))})(0, {a: 0}, {a: 0}, {a: 1}).a).toBe(0);
});

it('object({a: to(at(0), at(1))})', () => {
  expect(object({a: to(at(0), at(1))})(0.5, {a: 0}, {a: 0}, {a: 1}).a).toBe(0.5);
});

it('object({a: to(at(0), at(1))})', () => {
  expect(object({a: to(at(0), at(1))})(1, {a: 0}, {a: 0}, {a: 1}).a).toBe(1);
});

it('to(object({a: at(0)}), object({a: at(1)}))', () => {
  expect(to(object({a: at(0)}), object({a: at(1)}))(0, {a: 0}, {a: 0}, {a: 1}).a).toBe(0);
});

it('to(object({a: at(0)}), object({a: at(1)}))', () => {
  expect(to(object({a: at(0)}), object({a: at(1)}))(0.5, {a: 0}, {a: 0}, {a: 1}).a).toBe(0.5);
});

it('to(object({a: at(0)}), object({a: at(1)}))', () => {
  expect(
    to(
      object({a: at(0)}),
      object({a: at(1)})
    )(
      1, {a: 0}, {a: 0}, {a: 1}
    ).a
  ).toBe(1);
});
