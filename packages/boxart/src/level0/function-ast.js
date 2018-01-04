const literal = value => ({op: 'literal', value});
const l = literal;
const write = (name, value) => ({op: 'write', name, value});
const w = write;
const read = name => ({op: 'read', name});
const r = read;
const store = (ref, member, value) => ({op: 'store', ref, member, value});
const st = store;
const load = (ref, member) => ({op: 'load', ref, member});
const lo = load;

const unary = (operator, right) => ({op: 'unary', operator, right});

const binary = (operator, left, right) => ({op: 'binary', operator, left, right});

const eq = (left, right) => binary('==', left, right);
const ne = (left, right) => binary('!=', left, right);
const lt = (left, right) => binary('<', left, right);
const lte = (left, right) => binary('<=', left, right);
const gt = (left, right) => binary('>', left, right);
const gte = (left, right) => binary('>=', left, right);

const and = (left, right) => binary('&&', left, right);
const or = (left, right) => binary('||', left, right);

const add = (left, right) => binary('+', left, right);
const sub = (left, right) => binary('-', left, right);
const mul = (left, right) => binary('*', left, right);
const div = (left, right) => binary('/', left, right);
const mod = (left, right) => binary('%', left, right);
const min = (left, right) => binary('min', left, right);
const max = (left, right) => binary('max', left, right);
const abs = right => unary('abs', right);

const body = (body) => ({op: 'body', body});
const for_of = (iterable, keys, _body) => ({
  op: 'for_of', iterable, keys, body: body(_body),
});
const not_last = (not_last, last) => ({op: 'not_last', last, not_last});
const branch = (test, _then, _else = []) => (
  {op: 'branch', test, body: body(_then), else: body(_else)}
);
const loop = (test, _body) => ({op: 'loop', test, body: body(_body)});
const call = (func, args) => ({op: 'call', func, args});
const func = (args, _body) => ({op: 'func', args, body: body(_body)});
const methods = (methods) => ({op: 'methods', methods});

module.exports = {
  literal,
  l,
  write,
  w,
  read,
  r,
  store,
  st,
  load,
  lo,

  unary,
  binary,

  eq,
  ne,
  lt,
  lte,
  gt,
  gte,

  and,
  or,

  add,
  sub,
  mul,
  div,
  mod,
  min,
  max,
  abs,

  body,
  for_of,
  not_last,
  branch,
  loop,
  call,
  func,
  methods,
};
