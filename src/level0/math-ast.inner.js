const _ast = require('./function-ast');
const astRegistry = require('./ast-registry');
const ast = astRegistry(_ast);

const unary = ast.context(({
  func, call, lo, l, r,
}) => o => (value, deref, funcArgs, callArgs) => {
  const f = x => (
    value(func(funcArgs, [
      o(call(deref(x), callArgs)),
    ]))
  );
  f.args = [['x'], r('x')];
  return f;
});

const binary = ast.context(({
  func, call, lo, l, r,
}) => o => (value, deref, funcArgs, callArgs) => {
  const f = (x, y) => (
    value(func(funcArgs, [
      o(
        call(deref(x), callArgs),
        call(deref(y), callArgs)
      ),
    ]))
  );
  f.args = [['x', 'y'], r('x'), r('y')];
  return f;
});

const [
  abs,
] = ast.context(({
  abs,
}) => [
  abs,
].map(unary));

const [
  add, sub, mul, div, mod, min, max, eq, ne, lt, lte, gt, gte,
] = ast.context(({
  add, sub, mul, div, mod, min, max, eq, ne, lt, lte, gt, gte,
}) => [
  add, sub, mul, div, mod, min, max, eq, ne, lt, lte, gt, gte,
].map(binary));

module.exports = {
  abs,
  add, sub, mul, div, mod, min, max, eq, ne, lt, lte, gt, gte,
};
