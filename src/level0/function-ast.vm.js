const _run_literal = ({pointer}) => JSON.parse(JSON.stringify(pointer.value));

const _run_write = ({run, scope, pointer}) => {
  return scope[pointer.name] = run(pointer.value);
};

const _run_read = ({scope, pointer}) => scope[pointer.name];

const _run_store = ({run, pointer}) => {
  return run(pointer.ref)[run(pointer.member)] = run(pointer.value);
};

const _run_load = ({run, pointer}) => (
  run(pointer.ref)[run(pointer.member)]
);

const _run_ops = {
  '==': (a, b) => a == b,
  '!=': (a, b) => a != b,
  '<': (a, b) => a < b,
  '<=': (a, b) => a <= b,
  '>': (a, b) => a > b,
  '>=': (a, b) => a >= b,

  '&&': (a, b) => a && b,
  '||': (a, b) => a || b,

  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '*': (a, b) => a * b,
  '/': (a, b) => a / b,

  'min': (a, b) => Math.min(a, b),
  'max': (a, b) => Math.max(a, b),
};

const _run_unary = ({run, pointer}) => (
  _run_ops[pointer.operator](run(pointer.right))
);

const _run_binary = ({run, pointer}) => (
  _run_ops[pointer.operator](run(pointer.left), run(pointer.right))
);

const _run_for_of = ({run, scope, pointer}) => {
  const entries = Object.entries(pointer.iterable);
  let result;
  for (const item of entries) {
    scope[pointer.keys[0]] = item[0];
    scope[pointer.keys[1]] = item[1];
    result = run(pointer.body);
  }
  return result;
};

const _run_branch = ({run, pointer}) => {
  if (run(pointer.test)) {
    return run(pointer.body);
  }
  else {
    return run(pointer.else);
  }
};

const _run_body = ({run, pointer}) => {
  let result;
  for (const statement of pointer.body) {
    result = run(statement);
  }
  return result;
};

const _run_call = ({run, context, pointer}) => {
  const func = pointer.func.op ? run(pointer.func) : pointer.func;
  context.stack.push(context.scope);
  context.scope = pointer.args.map(run);
  const result = run(func);
  context.scope = context.stack.pop();
  return result;
};

const _run_func = ({run, scope: args, pointer, context}) => {
  context.scope = {};
  pointer.args.forEach((key, index) => {
    context.scope[key] = args[index];
  });
  return run(pointer.body);
};

const _run_methods = ({run, func, pointer}) => run(pointer.methods.main);

const _run_instr = {
  literal: _run_literal,
  write: _run_write,
  read: _run_read,
  store: _run_store,
  load: _run_load,
  unary: _run_unary,
  binary: _run_binary,
  for_of: _run_for_of,
  branch: _run_branch,
  body: _run_body,
  call: _run_call,
  func: _run_func,
  methods: _run_methods,
};

const _run = (context, action) => {
  context._pointer.push(action);
  context.pointer = action;
  let result;
  if (typeof action === 'function') {
    result = action(...context.scope);
  }
  else if (action.op) {
    result = _run_instr[action.op](context);
  }
  context._pointer.pop(action);
  return result;
};

const run = (node, func, ...args) => {
  const context = {
    func,
    _pointer: [],
    pointer: null,
    stack: [],
    scope: args,
  };
  context.context = context;
  context.run = _run.bind(null, context);
  return context.run(node);
};

module.exports = run;
