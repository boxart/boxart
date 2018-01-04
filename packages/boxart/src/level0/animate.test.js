import {at, fromTo, object} from './animate';

it('at(0)', () => {
  expect(at(0)(0, 0, 0, 1)).toBe(0);
});

it('at(0.5)', () => {
  expect(at(0.5)(0, 0, 0, 1)).toBe(0.5);
});

it('at(1)', () => {
  expect(at(1)(0, 0, 0, 1)).toBe(1);
});

it('at(0).a', () => {
  expect(at(0).a(at(1), 0, 0, 0, 1)).toBe(0);
});

it('at(0).a', () => {
  expect(at(0).a(at(1), 0.5, 0, 0, 1)).toBe(0.5);
});

it('at(0).a', () => {
  expect(at(0).a(at(1), 1, 0, 0, 1)).toBe(1);
});

it('at(0).a', () => {
  expect(at(0).a(at(0.5), 1, 0, 0, 1)).toBe(0.5);
});

it('at(0.5).a', () => {
  expect(at(0.5).a(at(1), 0, 0, 0, 1)).toBe(0.5);
});

it('at(1).a', () => {
  expect(at(1).a(at(0), 0, 0, 0, 1)).toBe(1);
});

it('at(1).a', () => {
  expect(at(1).a(at(0), 1, 0, 0, 1)).toBe(0);
});

it('fromTo([at(0), at(1)])', () => {
  expect(fromTo([at(0), at(1)])(0, 0, 0, 1)).toBe(0);
});

it('fromTo([at(0), at(1)])', () => {
  expect(fromTo([at(0), at(1)])(0.5, 0, 0, 1)).toBe(0.5);
});

it('fromTo([at(0), at(1)])', () => {
  expect(fromTo([at(0), at(1)])(1, 0, 0, 1)).toBe(1);
});

it('fromTo([at(0), at(0.5)])', () => {
  expect(fromTo([at(0), at(0.5)])(1, 0, 0, 1)).toBe(0.5);
});

it('fromTo([at(0.5), at(1)])', () => {
  expect(fromTo([at(0.5), at(1)])(0, 0, 0, 1)).toBe(0.5);
});

it('fromTo([at(1), at(0)])', () => {
  expect(fromTo([at(1), at(0)])(0, 0, 0, 1)).toBe(1);
});

it('object({a: fromTo([at(0), at(1)])})', () => {
  expect(object({a: fromTo([at(0), at(1)])})(0, {a: 0}, {a: 0}, {a: 1}).a).toBe(0);
});

it('object({a: fromTo([at(0), at(1)])})', () => {
  expect(object({a: fromTo([at(0), at(1)])})(0.5, {a: 0}, {a: 0}, {a: 1}).a).toBe(0.5);
});

it('object({a: fromTo([at(0), at(1)])})', () => {
  expect(object({a: fromTo([at(0), at(1)])})(1, {a: 0}, {a: 0}, {a: 1}).a).toBe(1);
});

it('fromTo([object({a: at(0)}), object({a: at(1)})])', () => {
  expect(fromTo([object({a: at(0)}), object({a: at(1)})])(0, {a: 0}, {a: 0}, {a: 1}).a).toBe(0);
});

it('fromTo([object({a: at(0)}), object({a: at(1)})])', () => {
  expect(fromTo([object({a: at(0)}), object({a: at(1)})])(0.5, {a: 0}, {a: 0}, {a: 1}).a).toBe(0.5);
});

it('fromTo([object({a: at(0)}), object({a: at(1)})])', () => {
  expect(fromTo([object({a: at(0)}), object({a: at(1)})])(1, {a: 0}, {a: 0}, {a: 1}).a).toBe(1);
});
