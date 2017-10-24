const a = require('./function-ast');

class Node {
  constructor(o) {
    Object.assign(this, o);
  }
}

class Token extends Node {
  toString() {
    return this.token;
  }
}

class Local extends Node {
  constructor(...args) {
    super(...args);

    if (typeof this.name !== 'string') {
      throw new Error('assertion: Local "name" must be a string.');
    }
  }

  toString() {
    return this.name;
  }
}

class Declare extends Node {
  toString() {
    return `var ${this.local}`;
  }
}

class Constant extends Node {
  toString() {
    return `var ${this.local.toString()} = ${this.value.toString()};`;
  }
}

class Expr extends Node {
  toString() {
    try {
      return this.expr.join('');
    }
    catch(e) {
      // return '"bad expression"';
      throw e;
    }
  }
}

class Line extends Expr {
  toString() {
    if (this.expr.length === 0) {
      return '';
    }
    return super.toString() + ';';
  }
  toJSON() {
    return Object.assign({
      constructor: 'Line',
    }, this);
  }
}

class Binary extends Expr {
  constructor(op, left, right) {
    super({
      type: 'expression',
      expr: [token('('), left, op, right, token(')')],
    });
  }

  get op() {
    return this.expr[2];
  }

  get left() {
    return this.expr[1];
  }

  get right() {
    return this.expr[3];
  }
}

class Literal extends Node {
  toString() {
    return this.value;
  }
}

class Result extends Expr {}

Result.hasResult = ({expr}) => {
  if (!expr) {return false;}
  for (let i = expr.length - 1; i >= 0; --i) {
    if (isResult(expr[i])) {
      return true;
    }
    else if (expr[i].type === 'expression') {
      const result = Result.hasResult(expr[i]);
      if (result) {
        return true;
      }
    }
  }
  return false;
};

const isResult = _expr => _expr.expr &&
  (_expr instanceof Result || _expr.result);

Result.take = _expr => {
  if (!_expr.expr) {
    return expr([_expr]);
  }
  if (isResult(_expr)) {
    return _expr;
  }
  for (let i = _expr.expr.length - 1; i >= 0; --i) {
    if (isResult(_expr.expr[i])) {
      if (_expr.expr[i] instanceof Result) {
        return resultless(expr(_expr.expr.splice(i, 1)[0].expr));
      }
      else {
        return resultless(_expr.expr.splice(i, 1)[0]);
      }
    }
    else if (_expr.expr[i].type === 'expression') {
      const result = Result.take(_expr.expr[i]);
      if (result) {
        return result;
      }
    }
  }
  return null;
};

Result.taken = _expr => {
  if (!_expr.expr) {
    return expr([]);
  }
  if (isResult(_expr)) {
    return expr([]);
  }
  return _expr;
};

const token = str => new Token({type: 'token', token: str});
const local = name => new Local({type: 'local', name});
const declare = local => new Declare({type: 'declare', local});
const constant = (local, value) => new Constant({type: 'constant', local, value});
const line = item => new Line({type: 'expression', expr: [item]});
const expr = ary => new Expr({type: 'expression', expr: ary});
const binary = (op, left, right) => {
  let _leftTaken = [];
  let _left = left;
  if (Result.hasResult(left)) {
    _leftTaken = Result.taken(left);
    _left = Result.take(left);
  }
  let _rightTaken = [];
  let _right = right;
  if (Result.hasResult(right)) {
    _rightTaken = Result.taken(right);
    _right = Result.take(right);
  }
  if (_left !== left || _right !== right) {
    return expr([
      _leftTaken,
      _rightTaken,
      result([
        new Binary(op, lineless(_left), lineless(_right)),
      ])
    ]);
  }
  return new Binary(op, left, right);
};
const literal = value => new Literal({type: 'literal', value});
const block = ary => new Block({type: 'expression', expr: ary});
const result = ary => new Result({type: 'expression', expr: ary});
const resultless = _r => {
  if (_r instanceof Result) {
    any(_r, node => {node.result = false;});
    return expr(_r.expr);
  }
  else {
    any(_r, node => {node.result = false;});
    pop(_r, node => node instanceof Result ? expr(node.expr) : false);
    return _r;
  }
}
const lineless = _r => {
  if (_r instanceof Line) {
    return expr(_r.expr);
  }
  else {
    pop(_r, node => node instanceof Line ? expr(node.expr) : false);
    return _r;
  }
}
const resultLast = ary => Result.transformLast(expr(ary));
const lift = args => {
  if (args.map(Result.hasResult).filter(Boolean).length > 0) {
    const taken = args.map(Result.taken).filter(Boolean);
    const take = args.map(Result.take).filter(Boolean);
    return expr([
      ...taken,
      result([
        ...take,
      ]),
    ]);
  }
  else {
    return expr(args);
  }
};

const _compile_literal = ({compile, pointer, stack, scope}) => {
  if (pointer.value && pointer.value.op === 'read') {
    if (
      _compile_lookup(stack, scope, pointer.value.name)[pointer.value.name] &&
      _compile_lookup(stack, scope, pointer.value.name)[pointer.value.name].op === 'literal'
    ) {
      return _compile_lookup(stack, scope, pointer.value.name)[pointer.value.name];
    }
    else if (
      typeof _compile_lookup(stack, scope, pointer.value.name)[pointer.value.name] === 'string'
    ) {
      return local(_compile_lookup(stack, scope, pointer.value.name)[pointer.value.name]);
    }
    return literal(pointer.value.name);
    // return compile(pointer.value);
  }
  if (pointer.value && pointer.value.op === 'func') {
    return compile(pointer.value);
  }
  else if (typeof pointer.value === 'string') {
    return literal(JSON.stringify(pointer.value));
  }
  else if (Array.isArray(pointer.value)) {
    return expr([token('['), token(']')]);
  }
  else if (typeof pointer.value === 'object') {
    const entries = Object.entries(pointer.value);
    return expr(
      [token('{')]
      .concat([token('}')])
    );
  }
  else {
    return literal(pointer.value);
  }
}

const _new_local_name = ({names}, name) => {
  let _name;
  if (!names[name]) {
    names[name] = [];
  }
  if (names[name].length === 0) {
    _name = name;
  }
  else {
    _name = `_${name}${names[name].length}`;
  }
  names[name].push(_name);
  return _name;
};

const _set_local_name = ({locals, scope}, name, _name) => {
  if (!locals[name]) {
    locals[name] = _name;
    scope[name] = _name;
  }
};

const _set_scope_name = ({scope}, name, _name) => {
  scope[name] = _name;
};

const _get_scope_name = ({scope}, name) => {
  return scope[name];
};

const _get_local_name = ({locals, context}, name) => {
  if (!locals[name]) {
    return _new_local_name(context, name);
  }
  else {
    return _get_scope_name(context, name);
  }
};

const _compile_write = ({write, compile, pointer, locals, scope, names, vars}) => {
  let _name;
  if (!locals[pointer.name]) {
    if (!names[pointer.name]) {
      names[pointer.name] = [];
    }
    const name = `_${pointer.name}${names[pointer.name].length}`;
    names[pointer.name].push(name);
    _name = name;
  }
  else {
    _name = scope[pointer.name];
  }
  const value = compile(pointer.value);
  let _result;
  if (Result.hasResult(value)) {
    _result = expr([
      Result.taken(value),
      result([
        declare(local(_name)),
        local(_name),
        token(' = '),
        Result.take(value),
      ]),
    ]);
  }
  else {
    _result = expr([
      declare(local(_name)),
      local(_name),
      token(' = '),
      value,
    ]);
  }
  if (!locals[pointer.name]) {
    locals[pointer.name] = _name;
    scope[pointer.name] = _name;
  }
  return _result;
};

const _compile_read = ({write, compile, pointer, scope, stack}) => {
  let _scope = scope;
  let stackIndex = stack.length - 1;
  while (stackIndex >= 0 && !_scope[pointer.name]) {
    _scope = stack[stackIndex][1];
    stackIndex -= 1;
  }
  if (_scope[pointer.name] && _scope[pointer.name].op === 'literal') {
    return compile(_scope[pointer.name]);
  }
  else {
    try {
      return local(_scope[pointer.name]);
    }
    catch (e) {
      console.log(pointer.name, stack);
      throw e;
    }
  }
};

const _compile_lookup = (stack, scope, name) => {
  let _scope = scope;
  let stackIndex = stack.length - 1;
  while (stackIndex >= 0 && !_scope[name]) {
    _scope = stack[stackIndex][1];
    stackIndex -= 1;
  }
  return _scope;
};

const _compile_store = ({write, compile, pointer, stack, scope}) => {
  const _ref = compile(pointer.ref);

  const _member = pointer.member;
  let _deref;
  if (_member.op === 'literal') {
    _deref = expr([token('.'), literal(_member.value)]);
  }
  else if (_member.op === 'read' && _compile_lookup(stack, scope, _member.name)[_member.name].op === 'literal') {
    const found = _compile_lookup(stack, scope, _member.name)[_member.name].value;
    _deref = expr([token('.'), literal(found)]);
  }
  else {
    _deref = expr([token('['), compile(_member), token(']')]);
  }

  const _value = compile(pointer.value);
  let _refTaken = expr([]);
  let _refTake = _ref;
  let _derefTaken = expr([]);
  let _derefTake = _deref;
  let _valueTaken = expr([]);
  let _valueTake = _value;
  if (Result.hasResult(_ref)) {
    _refTaken = Result.taken(_ref);
    _refTake = Result.take(_ref);
  }
  if (Result.hasResult(_deref)) {
    _derefTaken = Result.taken(_deref);
    _derefTake = Result.take(_deref);
  }
  if (Result.hasResult(_value)) {
    _valueTaken = Result.taken(_value);
    _valueTake = Result.take(_value);
  }
  if (
    _refTake !== _ref ||
    _derefTake !== _deref ||
    _valueTake !== _value
  ) {
    return expr([
      ...(_refTaken.expr ? _refTaken.expr : [_refTaken]),
      ...(_derefTaken.expr ? _derefTaken.expr : [_derefTaken]),
      ...(_valueTaken.expr ? _valueTaken.expr : [_valueTaken]),
      line(lineless(result([
        _refTake,
        _derefTake,
        token(' = '),
        _valueTake,
      ]))),
    ]);
  } 

  return expr([
    _ref,
    _deref,
    token(' = '),
    _value,
  ]);
};

const _compile_load = ({write, compile, pointer, stack, scope}) => {
  const _ref = compile(pointer.ref);

  const _member = pointer.member;
  let _deref;
  if (_member.op === 'literal' && _member.value === 'methods') {
    _deref = expr([]);
  }
  else if (_member.op === 'literal' && _member.value && _member.value.op === 'read' && _compile_lookup(stack, scope, _member.name)[_member.name]) {
    _deref = expr([token('['), literal(_compile_lookup(stack, scope, _member.name)[_member.name]), token(']')]);
  }
  else if (_member.op === 'literal' && _member.value && _member.value.op === 'read') {
    _deref = expr([token('['), compile(_member), token(']')]);
  }
  else if (_member.op === 'literal' && typeof _member.value === 'number') {
    _deref = expr([token('['), literal(_member.value), token(']')]);
  }
  else if (_member.op === 'literal') {
    _deref = expr([token('.'), literal(_member.value)]);
  }
  else if (_member.op === 'read' && _compile_lookup(stack, scope, _member.name)[_member.name].op === 'literal') {
    const found = _compile_lookup(stack, scope, _member.name)[_member.name].value;
    _deref = expr([token('.'), literal(found)]);
  }
  else {
    _deref = expr([token('['), compile(_member), token(']')]);
  }

  if (Result.hasResult(_ref)) {
    return expr([
      Result.taken(_ref),
      result([
        Result.take(_ref),
        _deref,
      ]),
    ]);
  }
  return expr([_ref, _deref]);
};

const _compile_ops = {
  '==': (a, b) => lift([token('('), a, token(' == '), b, token(')')]),
  '!=': (a, b) => lift([token('('), a, token(' != '), b, token(')')]),
  '<': (a, b) => lift([token('('), a, token(' < '), b, token(')')]),
  '<=': (a, b) => lift([token('('), a, token(' <= '), b, token(')')]),
  '>': (a, b) => lift([token('('), a, token(' > '), b, token(')')]),
  '>=': (a, b) => lift([token('('), a, token(' >= '), b, token(')')]),

  '&&': (a, b) => lift([token('('), a, token(' && '), b, token(')')]),
  '||': (a, b) => lift([token('('), a, token(' || '), b, token(')')]),

  '+': (a, b) => binary(token(' + '), a, b),
  '-': (a, b) => binary(token(' - '), a, b),
  '*': (a, b) => binary(token(' * '), a, b),
  '/': (a, b) => binary(token(' / '), a, b),
  '%': (a, b) => binary(token(' % '), a, b),

  'min': (a, b) => lift([token('Math.min('), a, token(', '), b, token(')')]),
  'max': (a, b) => lift([token('Math.max('), a, token(', '), b, token(')')]),
  'abs': a => lift([token('Math.abs('), a, token(')')]),
};

const _compile_unary = ({write, compile, pointer}) => (
  _compile_ops[pointer.operator](compile(pointer.right))
);

const _compile_binary = ({write, compile, pointer}) => (
  _compile_ops[pointer.operator](
    compile(pointer.left),
    compile(pointer.right)
  )
);

const _compile_for_of = ({compile, pointer, context, scope, locals, names}) => {
  if (pointer.iterable.op === 'read') {
    const i = '_for_of_index';
    const _i = _new_local_name(context, i);
    const _i_last_locals = locals[i];
    const _i_last_scope = scope[i];
    locals[i] = _i;
    scope[i] = _i;

    const len = '_for_of_length';
    const _len = _new_local_name(context, len);
    const _len_last_locals = locals[len];
    const _len_last_scope = scope[len];
    locals[len] = _len;
    scope[len] = _len;

    const _setup = compile(a.w(i, a.l(0)));
    const _test = compile(a.lt(a.r(i), a.r(len)));
    const _setupHasResult = Result.hasResult(_setup);
    const _testHasResult = Result.hasResult(_test);
    const _result = expr([
      compile(a.body([a.w('constant_entries', a.call(a.l('Object.entries'), [pointer.iterable]))])),
      resultless(expr([
        compile(a.w(len, a.lo(a.r('constant_entries'), a.l('length')))),
        token(';'),
      ])),
      _setupHasResult ? Result.taken(_setup) : expr([]),
      _testHasResult ? Result.taken(_test) : expr([]),
      expr([token('for '), token('(')]),
        expr([_setupHasResult ? Result.take(_setup) : _setup, token('; ')]),
        expr([_testHasResult ? Result.take(_test) : _test, token('; ')]),
        expr([compile(a.r(i)), token('++')]),
      expr([token(') ')]),
      token('{'),
      resultless(compile(a.body([
        pointer.keys[0] ?
          a.w(pointer.keys[0],
            a.lo(a.lo(a.r('constant_entries'), a.r(i)), a.l(0))
          ) :
          a.body([]),
        a.w(pointer.keys[1],
          a.lo(a.lo(a.r('constant_entries'), a.r(i)), a.l(1))
        ),
        ...pointer.body.body
      ]))),
      token('}'),
      result([]),
    ]);

    names[i].pop();
    locals[i] = _i_last_locals;
    scope[i] = _i_last_scope;
    names[len].pop();
    locals[len] = _len_last_locals;
    scope[len] = _len_last_scope;

    return _result;
  }
  else {
    const i = '_for_of_index';
    const _i = _new_local_name(context, i);
    const _i_last_locals = locals[i];
    const _i_last_scope = scope[i];
    locals[i] = _i;

    const len = '_for_of_length';
    const _len = _new_local_name(context, len);
    const _len_last_locals = locals[len];
    const _len_last_scope = scope[len];
    locals[len] = _len;

    scope[len] = a.l(Object.entries(pointer.iterable).length);

    const _result = expr([
      ...Object.entries(pointer.iterable)
      .map(([key, value], index) => {
        scope[i] = a.l(index);

        const _key = _new_local_name(context, pointer.keys[0]);
        const _key_last_locals = locals[pointer.keys[0]];
        const _key_last_scope = scope[pointer.keys[0]];
        const _value = _new_local_name(context, pointer.keys[1]);
        const _value_last_locals = locals[pointer.keys[0]];
        const _value_last_scope = scope[pointer.keys[0]];

        locals[pointer.keys[0]] = _key;
        scope[pointer.keys[0]] = a.l(key);
        locals[pointer.keys[1]] = _value;
        scope[pointer.keys[1]] = value;

        const _body = compile(pointer.body);
        const _result = resultless(expr([
          compile(pointer.body),
        ]));

        names[pointer.keys[0]].pop();
        locals[pointer.keys[0]] = _key_last_locals;
        scope[pointer.keys[0]] = _key_last_scope;
        names[pointer.keys[1]].pop();
        locals[pointer.keys[1]] = _value_last_locals;
        scope[pointer.keys[1]] = _value_last_scope;

        return _result;
      }),
      result([]),
    ]);

    names[i].pop();
    locals[i] = _i_last_locals;
    scope[i] = _i_last_scope;
    names[len].pop();
    locals[len] = _len_last_locals;
    scope[len] = _len_last_scope;

    return _result;
  }
};

const _compile_not_last = ({compile, pointer, scope}) => {
  if (scope._for_of_index.op && scope._for_of_index.op === 'literal') {
    return compile(
      scope._for_of_index.value < scope._for_of_length.value - 1 ?
        pointer.not_last :
        pointer.last
    );
  }
  else {
    return compile(a.call(a.func([], [
      a.w('not_last', pointer.not_last),
      a.branch(a.gte(a.r('_for_of_index'), a.sub(a.r('_for_of_length'), a.l(1))), [
        a.w('not_last', pointer.last),
      ]),
      a.r('not_last'),
    ]), []));
  }
};

const _compile_branch = ({compile, pointer, context}) => {
  if (
    pointer.test.op === 'load' &&
    _call_search(pointer.test, context) &&
    !_call_search(pointer.test, context).notFound &&
    !!~['func', 'methods'].indexOf(_call_search(pointer.test, context).op)
  ) {
    return compile(pointer.body);
  }
  else if (
    pointer.test.op === 'load' &&
    _call_search(pointer.test.ref, context) &&
    !_call_search(pointer.test.ref, context).notFound &&
    !!~['func', 'methods'].indexOf(_call_search(pointer.test.ref, context).op)
  ) {
    return compile(pointer.else);
  }
  else {
    const _test = compile(pointer.test);
    let _if;
    if (Result.hasResult(_test)) {
      _if = expr([
        Result.taken(_test),
        expr([
          token('if '), token('('),
          lineless(Result.take(_test)),
          token(') '),
        ]),
        token('{'),
        resultless(compile(pointer.body)),
        token('}'),
      ]);
    }
    else {
      _if = expr([
        expr([
          token('if '),
          token('('),
          lineless(_test),
          token(') '),
        ]),
        token('{'),
        resultless(compile(pointer.body)),
        token('}'),
      ]);
    }
  
    if (pointer.else.body.length) {
      return expr([
        _if,
        token('else '),
        token('{'),
        resultless(compile(pointer.else)),
        token('}'),
      ]);
    }
    return _if;
  }
};

const _compile_loop = ({compile, pointer}) => {
  return expr([
    token('while ('),
      compile(pointer.test),
    token(')'), token('{'),
      compile(pointer.body),
    token('}'),
  ]);
};

const _compile_body = ({write, compile, pointer}) => {
  const b = pointer.body
    .map(compile)
    .filter(Boolean)
    .map(line);

  if (b.length === 0) {
    return expr([]);
  }
  else if (b.length === 1) {
    if (Result.hasResult(b[0])) {
      return expr(b);
    }
    else {
      return result(b);
    }
  }
  if (Result.hasResult(b[b.length - 1])) {
    return expr([
      ...b.slice(0, b.length - 1).map(resultless),
      Result.taken(b[b.length - 1]),
      result([Result.take(b[b.length - 1])]),
    ]);
  }
  return expr([
    ...b.slice(0, b.length - 1).map(resultless),
    result([b[b.length - 1]]),
  ]);
};

const _call_search = (ref, context) => {
  if (ref.op === 'func' || typeof ref === 'function') {
    return ref;
  }
  else if (ref.op === 'literal' && ref.value && ref.value.op === 'read') {
    return ref.value;
  }
  else if (ref.op === 'literal') {
    return ref.value;
  }
  else if (
    ref.op === 'binary' && ref.operator === '||' && (
      ref.left.op !== 'load' &&
        _call_search(ref.left, context) &&
        !_call_search(ref.left, context).notFound && (
          _call_search(ref.left, context).op === 'func' ||
          _call_search(ref.left, context).op === 'methods' ||
          typeof _call_search(ref.left, context) === 'function' ||
          Array.isArray(_call_search(ref.left, context))
        ) ||
      ref.left.op === 'load' && ref.left.ref.op !== 'load' &&
        _call_search(ref.left.ref, context) &&
        !_call_search(ref.left.ref, context).notFound && (
          _call_search(ref.left.ref, context).op === 'func' ||
          _call_search(ref.left.ref, context).op === 'methods' ||
          typeof _call_search(ref.left.ref, context) === 'function' ||
          Array.isArray(_call_search(ref.left.ref, context))
        ) ||
      ref.left.op === 'load' && ref.left.ref.op === 'load' &&
        ref.left.ref.ref.op !== 'load' &&
        _call_search(ref.left.ref.ref, context) &&
        !_call_search(ref.left.ref.ref, context).notFound (
          _call_search(ref.left.ref.ref, context).op === 'func' ||
          _call_search(ref.left.ref.ref, context).op === 'methods' ||
          typeof _call_search(ref.left.ref.ref, context) === 'function' ||
          Array.isArray(_call_search(ref.left.ref.ref, context))
        ) ||
      false
      // ref.left.op === 'load' && ref.left.ref.op === 'load' &&
      //   ref.left.ref.ref.op === 'load' && ref.left.ref.ref.ref.op !== 'load' &&
      //   _call_search(ref.left.ref.ref.ref, context) && (
      //     _call_search(ref.left.ref.ref.ref, context).op === 'func' ||
      //     _call_search(ref.left.ref.ref.ref, context).op === 'methods' ||
      //     typeof _call_search(ref.left.ref.ref.ref, context) === 'function' ||
      //     Array.isArray(_call_search(ref.left.ref.ref.ref, context))
      //   )
    )
  ) {
    const _left = _call_search(ref.left, context);
    if (_left && !_left.notFound) {
      return _left;
    }
    else {
      const _right = _call_search(ref.right, context);
      if (typeof _right === 'string') {
        return null;
      }
      // return _right;
      else if (
        _right && !_right.notFound
        // _right.op === 'func' || typeof _right === 'function'
      ) {
        return _right;
      }
      return null;
    }
  }
  else if (
    ref.op === 'binary' && ref.operator === '||'
  ) {
    return null;
  }
  else if (
    ref.op === 'binary' &&
    ref.operator === '-' &&
    typeof _call_search(ref.left, context) === 'number' &&
    typeof _call_search(ref.right, context) === 'number'
  ) {
    const _left = _call_search(ref.left, context);
    const _right = _call_search(ref.right, context);
    return _left - _right;
  }
  else if (
    ref.op === 'binary' &&
    ref.operator === '+' &&
    typeof _call_search(ref.left, context) === 'number' &&
    typeof _call_search(ref.right, context) === 'number'
  ) {
    const _left = _call_search(ref.left, context);
    const _right = _call_search(ref.right, context);
    return _left + _right;
  }
  else if (ref.op === 'read') {
    if (
      _compile_lookup(context.stack, context.scope, ref.name)[ref.name] &&
      _compile_lookup(context.stack, context.scope, ref.name)[ref.name].op === 'literal'
    ) {
      let maybeName = _compile_lookup(context.stack, context.scope, ref.name)[ref.name].value;
      if (typeof maybeName === 'string') {
        return local(maybeName);
      }
      return maybeName;
    }
    else {
      let maybeName = _compile_lookup(context.stack, context.scope, ref.name)[ref.name];
      if (typeof maybeName === 'string') {
        return local(maybeName);
      }
      return maybeName;
    }
  }
  else if (
    ref.op === 'load' &&
    _call_search(ref.ref, context) &&
    (
      ref.member.op === 'literal' ||
      typeof _call_search(ref.member, context) === 'number' ||
      typeof _call_search(ref.member, context) === 'string' ||
      _call_search(ref.member, context) &&
        !_call_search(ref.member, context).notFound
    )
  ) {
    let _ref = _call_search(ref.ref, context);
    if (ref.member.op === 'literal' && ref.member.value === 'methods') {
      return _ref;
    }
    if (_ref.op === 'methods') {
      _ref = _ref.methods;
    }
    if (ref.member.op === 'literal') {
      return _ref[ref.member.value];
    }
    else {
      return _ref[_call_search(ref.member, context)];
    }
  }
  else if (ref.op === 'methods') {
    return ref.methods[context.func];
  }
  else {
    return Object.assign(a.func([], [a.l(undefined)]), {notFound: true});
  }
};

const _commas = (value, index, ary) => {
  if (index < ary.length - 1) {
    return expr([value, token(', ')]);
  }
  else {
    return expr([value]);
  }
};

const _semicolon = _expr => {
  if (
    !_expr.expr ||
    _expr.expr &&
      _expr.expr[_expr.expr.length - 1] &&
      _expr.expr[_expr.expr.length - 1].token !== ';'
  ) {
    return expr([_expr, token(';')]);
  }
  return _expr;
};

const _semicolons = (value, index, ary) => {
  if (index < ary.length - 1) {
    return expr([value, token(';')]);
  }
  else {
    return expr([value]);
  }
};

const _compile_call = ({write, compile, pointer, context}) => {
  let func = _call_search(pointer.func, context);
  if (func && func.op === 'methods') {
    func = func.methods.main;
  }
  let _result;
  if (
    !func ||
    typeof func === 'function' ||
    typeof func === 'string' ||
    func.op === 'literal' &&
      func.value.op && func.value.op !== 'func' ||
    func.op === 'literal' && !func.value.op ||
    func.op === 'read' ||
    func.type === 'local'
  ) {
    let _func;
    if (!func) {
      _func = compile(pointer.func);
    }
    else if (func.op === 'literal' && func.value.op) {
      _func = compile(func.value);
    }
    else if (func.op === 'literal') {
      _func = literal(func.value);
    }
    else if (func.op === 'read' && pointer.func.op !== 'literal') {
      _func = compile(pointer.func);
    }
    else if (func.op === 'read') {
      _func = compile(func);
    }
    else if (func.type) {
      _func = func;
    }
    else {
      _func = literal(func.toString());
    }
    const _args = pointer.args.map(compile);
    const _argsTaken = [];
    const _argsTake = [];
    _args.forEach(a => {
      if (Result.hasResult(a)) {
        _argsTaken.push(Result.taken(a));
        _argsTake.push(Result.take(a));
      }
      else {
        _argsTake.push(a);
      }
    });
    if (_argsTaken.length) {
      _result = expr([
        ..._argsTaken,
        result([
          token('('), _func, token(')('),
          ..._argsTake.map(_commas),
          token(')'),
        ]),
      ]);
    }
    else {
      _result = expr([
        token('('), _func, token(')('),
        ..._argsTake.map(_commas),
        token(')'),
      ]);
    }
  }
  else {
    if (func.op === 'methods') {
      func = func.methods.main;
    }
    context.args = pointer.args.slice();
    _result = compile(func);
    context.args = null;
  }

  return _result;
};

const _push_stack = ({locals, scope, context}) => {
  context.stack.push([locals, scope]);
  context.locals = {};
  context.scope = {};
};

const _pop_stack = ({context}) => {
  const [locals, scope] = context.stack.pop();
  context.locals = locals;
  context.scope = scope;
};

const _pop_names = ({names}, _names) => {
  _names.forEach(key => {
    names[key].pop();
  });
};

const _compile_func = ({write, compile, pointer, context, lookupScope}) => {
  const args = context.args;
  context.args = null;

  if (!args) {
    const oldLocals = context.locals;
    const oldScope = context.scope;
    const args = context.args;

    _push_stack(context);

    const body = pointer.body;
    const _head = expr([
      token('function('), ...pointer.args.map(arg => {
        const name = _get_local_name(context, arg);
        _set_scope_name(context, arg, name);
        return local(name);
      }).map(_commas), token(') '),
    ]);
    let _body = compile(body);
    _body.args = pointer.args;

    const {options} = context;
    const {passes = 10} = options;
    const {rules: _rules = Object.keys(rules)} = options;
    const ruleKeys = _rules
    .concat(...(options._ruleSets || []).map(set => ruleSets[set]))
    .filter((r, i, rules) => rules.indexOf(r, i + 1) === -1);
    for (let i = 0; i < passes; ++i) {
      for (let r = 0; r < ruleKeys.length; ++r) {
        rules[ruleKeys[r]](_body);
      }
    }

    // pop out all local declarations
    const declares = pop(_body, node => node && node.type === 'declare');

    // Make one large var a, b, ... declaration
    if (declares.length) {
      const oneDeclare = declares
      .filter((d, i) => (
        declares.slice(i + 1)
        .findIndex(_d => d.local.name === _d.local.name) === -1
      ))
      .reduce((carry, d) => {
        carry.expr.push(d.local, token(', '));
        return carry;
      }, expr([]));
      oneDeclare.expr.pop();
      _body.expr.splice(0, 0, expr([token('var '), oneDeclare, token(';')]));
      if (_body.expr.length > 1) {
        _body.expr.splice(1, 0, token(' '));
      }
    }

    // pop out all constants
    const constants = pop(_body, node => node && node.type === 'constant');

    if (constants.length) {
      _body.expr.splice(0, 0, expr(constants.map(_semicolons)));
    }

    rules.markResults(_body);

    if (Result.hasResult(_body)) {
      const _bodyTaken = Result.taken(_body);
      const _bodyTake = Result.take(_body);
      _body = expr(
        (_bodyTaken.expr ? _bodyTaken.expr : [_bodyTaken])
        .concat(line(expr([token('return '), lineless(_bodyTake)])))
      );
    }
    else if (_body.expr && _body.expr.length > 0) {
      _body = expr(
        _body.expr.slice(0, _body.expr.length - 1)
        .concat(line(expr([token('return '), _body.expr[_body.expr.length - 1]])))
      );
    }

    resultless(_head);
    resultless(_body);

    const _result = expr([
      _head, token('{'),
      _body,
      token('}'),
    ]);

    _pop_names(context, Object.keys(context.locals));
    _pop_names(context, pointer.args);
    _pop_stack(context);

    return _result;
  }

  const oldScope = context.scope;
  _push_stack(context);

  const _args = [];
  pointer.args.forEach((name, index) => {
    let maybeCall;
    try {
      maybeCall = _call_search(args[index], context);
    }
    catch (e) {}
    if (args[index].op === 'literal' && args[index].value.op === 'read') {
      context.scope[name] =
        lookupScope(args[index].value.name)[args[index].value.name];
    }
    else if (args[index].op === 'literal') {
      context.scope[name] = args[index];
    }
    else if (args[index].op === 'read') {
      context.scope[name] = oldScope[args[index].name];
    }
    else if (maybeCall && !maybeCall.notFound) {
      if (maybeCall.type === 'local') {
        context.scope[name] = maybeCall.name;
      }
      else {
        context.scope[name] = maybeCall;
      }
    }
    else {
      // console.log(name, args[index]);
      if (
        args[index].op === 'binary' &&
        args[index].operator === '||' &&
        args[index].left.op === 'load' &&
        args[index].left.ref.op === 'literal' &&
        Array.isArray(args[index].left.ref.value)
      ) {
        _args.push(a.write(name), args[index].right);
      }
      else {
        _args.push(a.write(name, args[index]));
      }
    }
    // console.log(name, context.scope[name], maybeCall, args[index]);
  });

  const _expr = compile(a.body(_args.concat(pointer.body.body)));

  _pop_names(context, Object.keys(context.locals));
  _pop_stack(context);

  return _expr;
};

const _compile_methods = ({write, compile, pointer, func, options}) => (
  pointer.methods.op ?
    compile(pointer.methods) :
  pointer.methods.main ?
    compile(a.call(a.l(a.func([], [
      a.w('f', pointer.methods.main),
      ...(Object.keys(pointer.methods).filter(m => m !== 'main'))
      .filter(m => (options.methods || Object.keys(pointer.methods)).indexOf(m) !== -1)
      .map(m => (
        a.st(a.r('f'), a.l(m), pointer.methods[m])
      )),
      a.r('f'),
    ])), [])) :
    compile(a.call(a.l(a.func([], [
      a.w('f', a.l({})),
      ...Object.keys(pointer.methods)
      .map(m => (
        a.st(a.r('f'), a.l(m), pointer.methods[m])
      )),
      a.r('f'),
    ])), []))
);

const _compile_instr = {
  literal: _compile_literal,
  write: _compile_write,
  read: _compile_read,
  store: _compile_store,
  load: _compile_load,
  unary: _compile_unary,
  binary: _compile_binary,
  for_of: _compile_for_of,
  not_last: _compile_not_last,
  branch: _compile_branch,
  loop: _compile_loop,
  body: _compile_body,
  call: _compile_call,
  func: _compile_func,
  methods: _compile_methods,
};

const _compile = (context, next) => {
  context._pointer.push(context.pointer);
  context.pointer = next;
  const result = _compile_instr[next.op](context);
  context.pointer = context._pointer.pop();
  return result;
};

function any(node, fn, stack = []) {
  if (node.type === 'expression') {
    stack.push(node);
    for (let i = node.expr.length - 1; i >= 0; --i) {
      if (any(node.expr[i], fn, stack)) {
        return true;
      }
      else if (fn(node.expr[i], i, node, stack)) {
        return true;
      }
    }
    stack.pop();
  }
  return false;
}

function pop(node, fn, stack = []) {
  let result = [];
  if (node && node.type === 'expression') {
    stack.push(node);
    for (let i = node.expr.length - 1; i >= 0; --i) {
      result = result.concat(pop(node.expr[i], fn, stack));
      const replace = fn(node.expr[i], i, node, stack);
      if (replace) {
        result.push(node.expr[i]);
        if (typeof replace === 'object' && replace.type) {
          node.expr.splice(i, 1, replace);
        }
        else {
          node.expr.splice(i, 1);
        }
      }
    }
    stack.pop();
  }
  return result;
}

const rules = {
  markResults: ast => {
    ast.result = ast instanceof Result;
    any(ast, (node, i, parent, stack) => {
      node.result = Boolean(stack.find(n => n.result || n instanceof Result)) || node.result || node instanceof Result;
    });
  },

  flattenLines: ast => (
    pop(ast, (node, i, parent) => (
      parent instanceof Line &&
      parent.expr.length === 1 &&
      node.expr &&
      node.expr.length === 1 &&
      node.expr[0]
    )),
    pop(ast, (node, i, parent) => (
      node instanceof Line &&
      node.expr.length === 1 &&
      node.expr[0].expr &&
      !any(node.expr[0], (n, j, p) => (
        p === node.expr[0] && node instanceof Line
      )) &&
      new Line({type: 'expression', expr: node.expr[0].expr})
    )),
    pop(ast, (node, i, parent) => (
      node instanceof Line &&
      node.expr.length === 1 &&
      node.expr[0].expr &&
      !node.expr[0].expr.find(n => !(n instanceof Line)) &&
      node.expr[0]
    )),
    pop(ast, (node, i, parent) => (
      node.expr &&
      !(node instanceof Line) &&
      node.expr.find(n => n instanceof Line) &&
      node.expr.find(n => (
        n.expr && !(n instanceof Line) && n.expr.find(_n => _n instanceof Line)
      )) &&
      expr(node.expr.reduce((carry, n) => {
        if (n.expr && !(n instanceof Line)) {
          carry.push(...n.expr);
        }
        else {
          carry.push(n);
        }
        return carry;
      }, []))
    )),
    pop(ast, (node, i, parent) => (
      node.expr && !(node instanceof Line) &&
      node.expr.length === 1 &&
      node.expr[0].expr && !(node.expr[0] instanceof Line) &&
      !(node.expr[0].expr.find(n => !(n instanceof Line))) &&
      node.expr[0]
    )),
    pop(ast, node => (
      node instanceof Line &&
      !node.expr.find(n => !n.expr) &&
      !node.expr.find(n => n instanceof Line) &&
      node.expr.find(n => n.expr.find(_n => !_n instanceof Line)) &&
      expr(node.expr.reduce((carry, n) => {
        carry.push(...n.expr);
        return carry;
      }, []))
    ))
  ),

  collapseEmpty: ast => (
    pop(ast, (node, i, parent) => (
      node.expr && node.expr.length === 0
    ))
  ),

  collapse1LenExprAfterWrite: ast => (
    pop(ast, (node, i, parent) => (
      node.token === ' = ' &&
      parent[i + 1] &&
      parent[i + 1].expr &&
      parent[i + 1].expr.length === 1 &&
      parent[i + 1].expr[0]
    ))
  ),

  collapseLines: ast => (
    pop(ast, node => (
      node.expr &&
      node.expr.length === 1 &&
      node.expr[0] instanceof Line &&
      node.expr[0]
    ))
  ),

  collapseExprAroundLocal: ast => (
    pop(ast, node => (
      node.expr &&
      node.expr.length === 1 &&
      node.expr[0].name &&
      !isResult(node) &&
      node.expr[0]
    ))
  ),

  collapseExprAroundLiteral: ast => (
    pop(ast, node => (
      node.expr &&
      node.expr.length === 1 &&
      node.expr[0].type === 'literal' &&
      !isResult(node) &&
      node.expr[0]
    ))
  ),

  eliminateMul0: ast => (
    pop(ast, node => (
      node.op &&
      node.op.token === ' * ' && (
        node.left.value === 0 ||
        node.right.value === 0
      ) &&
      literal(0)
    ))
  ),

  reduceMul1: ast => (
    pop(ast, node => (
      node.op &&
      node.op.token === ' * ' && (
        node.left.value === 1 &&
        node.right ||
        node.right.value === 1 &&
        node.left
      )
    ))
  ),

  reduceAdd0: ast => (
    pop(ast, node => (
      node.type === 'expression' &&
      node.expr.find(n => n.token === ' + ') &&
      node.expr.find(n => n.value === 0) &&
      node.expr.find(n => n.value !== 0 && n.type !== 'token')
    ))
  ),

  reduceOpLiteral: ast => (
    pop(ast, node => (
      node.type === 'expression' &&
      node.expr.length === 5 &&
      node.expr[1].type === 'literal' &&
      node.expr[3].type === 'literal' && (
        node.expr[2].token === ' + ' &&
        literal(JSON.stringify(JSON.parse(node.expr[1].value) + JSON.parse(node.expr[3].value))) ||
        node.expr[2].token === ' - ' &&
        literal(JSON.stringify(JSON.parse(node.expr[1].value) - JSON.parse(node.expr[3].value))) ||
        node.expr[2].token === ' * ' &&
        literal(JSON.stringify(JSON.parse(node.expr[1].value) * JSON.parse(node.expr[3].value))) ||
        node.expr[2].token === ' / ' &&
        literal(JSON.stringify(JSON.parse(node.expr[1].value) / JSON.parse(node.expr[3].value)))
      )
    ))
  ),

  emulate: ast => {
    // - track top and inner args
    // - if an expression uses only tokens, literals, top and inner args, lift
    //   it to a new variable and replace its use with that variable.

    class EmulateScopeInner {
      constructor(parent = null, depth = 0) {
        this.map = {};
        this.args = {};
        this.parent = parent;
        this.child = null;
        this.depth = depth;
      }

      read(name, direction = 0) {
        if (this.map[name] && this.map[name][1]) {
          this.map[name][1]._read = (this.map[name][1]._read || 0) + 1;
        }
        if (this.parent && direction !== 1) {
          this.parent.read(name, -1);
        }
        if (this.child && direction !== -1) {
          this.child.read(name, 1);
        }
      }

      get(name) {
        return this.map[name] ?
          this.map[name][0] :
          null;
      }

      set(name, value, parent, direction = 0) {
        if (direction === 0 || this.map[name]) {
          this.map[name] = [
            value,
            parent || this.map[name][1]
          ];
        }
        if (this.parent && direction !== 1) {
          this.parent.set(name, null, null, -1);
        }
        if (this.child && direction !== -1) {
          this.child.set(name, null, null, 1);
        }
      }

      _nullAll(direction = 0) {
        for (const name in this.map) {
          this.map[name] = [null, this.map[name][1]];
        }
        if (this.parent && direction !== 1) {
          this.parent._nullAll(-1);
        }
        if (this.child && direction !== -1) {
          this.child._nullAll(1);
        }
      }

      isArg(name) {
        if (Boolean(this.args[name])) {
          return true;
        }
        if (this.parent) {
          return this.parent.isArg(name);
        }
        return false;
      }

      setArg(name) {
        this.args[name] = true;
      }

      push() {
        if (!this.child) {
          this.child = new EmulateScopeInner(this, this.depth + 1);
        }
        else {
          for (const name in this.child.map) {
            this.child.map[name][1]._read = (this.child.map[name][1]._read || 0) + 1;
            this.child.map[name] = [null, this.child.map[name][1]];
          }
        }
        return this.child;
      }

      pop() {
        return this.parent;
      }
    }

    class EmulateScope {
      constructor() {
        this.root = this.inner = new EmulateScopeInner();
      }

      read(name) {
        this.inner.read(name);
      }

      get(name) {
        return this.inner.get(name);
      }

      set(name, value, parent) {
        return this.inner.set(name, value, parent);
      }

      isArg(name) {
        return this.inner.isArg(name);
      }

      setArg(name) {
        this.inner.setArg(name);
      }

      push() {
        this.inner = this.inner.push();
      }

      pop() {
        this.inner = this.inner.pop();
      }
    }

    let scope = new EmulateScope();
    let readScope = {};

    for (let i = 0; ast.args && i < ast.args.length; i++) {
      scope.setArg(ast.args[i]);
    }

    const anyLocal = function(node) {
      if (node.name) {
        return true;
      }
      if (node.expr) {
        for (let i = 0; i < node.expr.length; i++) {
          if (anyLocal(node.expr[i])) {
            return true;
          }
        }
      }
      return false;
    };

    const hasLocal = function(name, node) {
      if (node.name === name) {
        return true;
      }
      if (node.expr) {
        for (let i = 0; i < node.expr.length; i++) {
          if (hasLocal(name, node.expr[i])) {
            return true;
          }
        }
      }
      return false;
    };

    const distinctLocals = function(node, locals = []) {
      if (node && node.name) {
        if (locals.indexOf(node.name) === -1) {
          locals.push(node.name);
          return 1;
        }
        return 0;
      }
      if (node && node.expr) {
        let nLocals = 0;
        for (let i = 0; i < node.expr.length; i++) {
          if (node.expr[i] === node) {throw new Error('circular');}
          nLocals += distinctLocals(node.expr[i], locals);
        }
        return nLocals;
      }
      return 0;
    };

    const markRead = function(node, i, parent) {
      if (node.name) {
        if (
          (
            parent.expr[i + 1] && parent.expr[i + 1].token !== ' = ' ||
            !parent.expr[i + 1]
          )
        ) {
          scope.read(node.name);
        }
      }
    };

    const _argConstant = (node, scope, tokenWhitelist) => {
      if (!node) {
        return false;
      }
      if (node.constant) {
        return false;
      }
      if (
        tokenWhitelist.indexOf(node.token) !== -1 ||
        node.name && scope.isArg(node.name) ||
        typeof node.value !== 'undefined' && !(node instanceof Constant) ||
        node.name && node.name.indexOf('_arg_constant') !== -1
      ) {
        return true;
      }
      if (node.expr) {
        for (let i = 0; i < node.expr.length; i++) {
          if (_argConstant(node.expr[i], scope, tokenWhitelist) === false) {
            return false;
          }
        }
        return true;
      }
      return false;
    };

    const argConstant = (node, scope) => {
      if (node.expr && node.expr[0].token === 'Math.min(') {
        return _argConstant(node, scope, ['Math.min(', ', ', ')']);
      }
      if (node.expr && node.expr.find(n => n.token === ')(')) {
        return _argConstant(node, scope, ['(', ')', ')(', ', ']);
      }
      return _argConstant(node, scope, ['(', ')', ')(']);
    };

    const count = (node, fn) => {
      let n = 0;
      if (fn(node)) {
        n += 1;
      }
      if (node.expr) {
        for (let i = 0; i < node.expr.length; i++) {
          n += count(node.expr[i], fn);
        }
      }
      return n;
    };

    const constants = [];
    let nextConstant = count(ast, node => node.constant);

    const run = function(node, i, parent) {
      if (!node) {return;}
      markRead(node, i, parent);
      if (node.expr) {
        if (node.expr.find(n => n.token === 'function(')) {
          for (let j = 0; j < node.expr.length; j++) {
            if (node.expr[j].name) {
              scope.setArg(node.expr[j].name);
            }
          }
        }
        else {
          for (let j = 0; j < node.expr.length; j++) {
            markRead(node.expr[j], j, node);
          }
        }
      }
      if (node.token === '{') {
        scope.push();
      }
      else if (node.token === '}') {
        scope.pop();
      }
      else if (node.type === 'local') {
        if (scope.get(node.name)) {
          return lineless(scope.get(node.name));
        }
        return node;
      }
      if (node.type === 'literal') {
        return node;
      }
      if (node.expr) {
        if (
          argConstant(node, scope) &&
          count(node, n => (
            !n.name && !n.expr
          )) &&
          count(node, n => (
            n.name && scope.isArg(n.name)
          ))
        ) {
          if (constants.find(c => String(node) === c[1])) {
            const c = constants.find(c => String(node) === c[1]);
            node.expr = [c[0]];
            return c[0];
          }
          const name = local(`_arg_constant${nextConstant++}`);
          const constant = [name, String(node), line(expr([declare(name), name, token(' = '), expr(node.expr)]))];
          any(constant[2], node => {
            node.constant = true;
          });
          constants.push(constant);
          node.expr = [name]
          return name;
        }
        if (
          node.expr[0] && node.expr[0].name &&
          node.expr[1] && node.expr[1].token === ' = '
        ) {
          const _result = run(node.expr[2], 2, node);
          if (scope.get(node.expr[0].name) === _result) {
            node.expr = [];
            return;
          }
          else if (_result && !hasLocal(node.expr[0].name, _result)) {
            if (scope.get(node.expr[0].name) === _result) {
              throw new Error('setting identical value already at variable');
            }
            node.lastRead = node._read;
            node.read = 0;
            node._read = 0;
            scope.set(node.expr[0].name, _result, node);
          }
          else {
            node.lastRead = node._read;
            node.read = 0;
            node._read = 0;
            scope.set(node.expr[0].name, null, node);
          }
        }
        else if (
          node.expr[1] && node.expr[1].name &&
          node.expr[2] && node.expr[2].token === ' = '
        ) {
          if (node._read === 0) {
            node.expr = [];
            return;
          }

          const _result = run(node.expr[3], 3, node);
          if (scope.get(node.expr[1].name) === _result) {
            node.expr = [];
            return;
          }
          else if (_result && !hasLocal(node.expr[1].name, _result)) {
            if (scope.get(node.expr[1].name) === _result) {
              throw new Error('setting identical value already at variable');
            }
            else {
              node.lastRead = node._read;
              node.read = 0;
              node._read = 0;
              scope.set(node.expr[1].name, _result, node);
            }
          }
          else {
            node.lastRead = node._read;
            node.read = 0;
            node._read = 0;
            scope.set(node.expr[1].name, null, node);
          }
        }
        else if (node.expr[2] && node.expr[2].token === ' = ') {
          run(node.expr[0], 0, node);
          const _result = run(node.expr[3], 3, node);
          if (_result) {
            node.expr[3] = _result;
          }
        }
        else if (
          node.expr.length === 3 &&
          node.expr[0].token === '(' && node.expr[2].token === ')'
        ) {
          return run(node.expr[1], 1, node);
        }
        else if (node.expr.length === 1 && node.expr[0].type === 'local') {
          return run(node.expr[0], 0, node);
        }
        else if (node.expr.length === 1 && node.expr[0].type === 'literal') {
          return node.expr[0];
        }
        else if (node.expr.length === 1) {
          return run(node.expr[0], 0, node);
        }
        else if (
          node.expr[2] && (
            node.expr[2].token === ' - ' ||
            node.expr[2].token === ' * ' ||
            node.expr[2].token === ' / '
          )
        ) {
          let run1, run3;
          if (node.expr[1].type === 'expression') {
            if (node.expr[1] === node) {throw new Error('circular expression');}
            run1 = run(node.expr[1], 1, node);
            if (run1 === node) {throw new Error('returned circular expr1')}
            if (run1) {
              node.expr[1] = run1;
            }
          }
          else if (node.expr[1].type === 'local') {
            if (node.expr[1].name && scope.get(node.expr[1].name)) {
              run1 = run(node.expr[1], 1, node);
              if (run1 === node) {throw new Error('returned circular local1')}
              if (run1 && run1 !== node) {
                node.expr[1] = run1;
              }
            }
          }
          if (node.expr[3].type === 'expression') {
            run3 = run(node.expr[3], 3, node);
            if (run3 === node) {throw new Error('returned circular expr3')}
            if (run3) {
              node.expr[3] = run3;
            }
          }
          else if (node.expr[3].type === 'local') {
            if (node.expr[3].name && scope.get(node.expr[3].name)) {
              run3 = run(node.expr[3], 3, node);
              if (run3 === node) {throw new Error('returned circular local3')}
              if (run3) {
                node.expr[3] = run3;
              }
            }
          }

          if (
            node.expr[1] && node.expr[1].type === 'literal' &&
            node.expr[3] && node.expr[3].type === 'literal'
          ) {
            if (node.expr[2].token === ' - ') {
              return literal(
                JSON.stringify(
                  JSON.parse(node.expr[1].value) -
                  JSON.parse(node.expr[3].value)
                )
              );
            }
            if (node.expr[2].token === ' * ') {
              return literal(
                JSON.stringify(
                  JSON.parse(node.expr[1].value) *
                  JSON.parse(node.expr[3].value)
                )
              );
            }
            if (node.expr[2].token === ' / ') {
              return literal(
                JSON.stringify(
                  JSON.parse(node.expr[1].value) /
                  JSON.parse(node.expr[3].value)
                )
              );
            }
          }
          if (
            node.expr[1] && node.expr[1].type === 'literal'
          ) {
            if (
              node.expr[2].token === ' * ' &&
              JSON.parse(node.expr[1].value) === 1
            ) {
              return node.expr[3];
            }
            if (
              node.expr[2].token === ' * ' &&
              JSON.parse(node.expr[1].value) === 0
            ) {
              return node.expr[1];
            }
          }
          if (
            node.expr[3] && node.expr[3].type === 'literal'
          ) {
            if (
              node.expr[2].token === ' * ' &&
              JSON.parse(node.expr[3].value) === 1
            ) {
              return node.expr[1];
            }
            if (
              node.expr[2].token === ' * ' &&
              JSON.parse(node.expr[3].value) === 0
            ) {
              return node.expr[3];
            }
          }
        }
        else if (node.expr[2] && node.expr[2].token === ' + ') {
          let run1, run3;
          if (node.expr[1].type === 'expression') {
            if (node.expr[1] === node) {throw new Error('circular expression');}
            run1 = run(node.expr[1], 1, node);
            if (run1 === node) {throw new Error('returned circular expr1')}
            if (run1) {
              node.expr[1] = run1;
            }
          }
          else if (node.expr[1].type === 'local') {
            if (node.expr[1].name && scope.get(node.expr[1].name)) {
              run1 = run(node.expr[1], 1, node);
              if (run1 === node) {throw new Error('returned circular local1')}
              if (run1 && run1 !== node) {
                node.expr[1] = run1;
              }
            }
          }
          if (node.expr[3].type === 'expression') {
            run3 = run(node.expr[3], 3, node);
            if (run3 === node) {throw new Error('returned circular expr3')}
            if (run3) {
              node.expr[3] = run3;
            }
          }
          else if (node.expr[3].type === 'local') {
            if (node.expr[3].name && scope.get(node.expr[3].name)) {
              run3 = run(node.expr[3], 3, node);
              if (run3 === node) {throw new Error('returned circular local3')}
              if (run3) {
                node.expr[3] = run3;
              }
            }
          }

          if (
            node.expr[1] && node.expr[1].type === 'literal' &&
            node.expr[3] && node.expr[3].type === 'literal'
          ) {
            return literal(
              JSON.stringify(
                JSON.parse(node.expr[1].value) +
                JSON.parse(node.expr[3].value)
              )
            );
          }
          if (
            node.expr[1] && node.expr[1].type === 'expression' &&
            node.expr[3] && node.expr[3].type === 'literal'
          ) {
            if (
              node.expr[1].expr[2] && node.expr[1].expr[2].token === ' + ' &&
              node.expr[1].expr[3] && node.expr[1].expr[3].type === 'literal'
            ) {
              return expr([
                node.expr[1].expr[0],
                node.expr[1].expr[1],
                node.expr[1].expr[2],
                run(expr([
                  node.expr[1].expr[0],
                  node.expr[1].expr[3],
                  node.expr[1].expr[2],
                  node.expr[3],
                  node.expr[1].expr[4],
                ]), 3, node.expr[1]),
                node.expr[1].expr[4],
              ]);
            }
            if (node.expr[3].value === '""' && node.expr[1]) {
              return node.expr[1];
            }
          }
          if (
            node.expr[1] && node.expr[1].type === 'literal' &&
            node.expr[3] && node.expr[3].type === 'expression'
          ) {
            if (
              node.expr[3].expr[2] && node.expr[3].expr[2].token === ' + ' &&
              node.expr[3].expr[1] && node.expr[3].expr[1].type === 'literal'
            ) {
              return expr([
                node.expr[3].expr[0],
                run(expr([
                  node.expr[3].expr[0],
                  node.expr[1],
                  node.expr[3].expr[2],
                  node.expr[3].expr[1],
                  node.expr[3].expr[4],
                ]), 1, node.expr[3]),
                node.expr[3].expr[2],
                node.expr[3].expr[3],
                node.expr[3].expr[4],
              ]);
            }
            if (node.expr[1].value === '""' && node.expr[3]) {
              return node.expr[3];
            }
          }
          return node;
        }
        else if (node.type !== 'declare') {
          for (let i = 0; i < node.expr.length; i++) {
            try {
              run(node.expr[i], i, node);
            }
            catch (e) {
              console.error(String(node.expr[i]));
              console.error(e.stack || e);
              throw e;
            }
          }
        }
      }
    };

    run(ast);

    ast.expr.splice(0, 0, ...constants.map(c => c[2]));
  },

  eliminateCanceledTerms: ast => (
    pop(ast, node => (
      node.op &&
      node.op.token === ' + ' &&
      node.left.op &&
      node.left.op.token === ' - ' &&
      node.left.right.name === node.right.name &&
      node.left.left
    ))
  ),

  collapseParantheses: ast => (
    // flatten extra parantheses
    pop(ast, node => (
      node.type === 'expression' &&
      node.expr.length === 3 &&
      node.expr[0].token === '(' &&
      node.expr[2].token === ')' &&
      node.expr[1].type === 'expression' &&
      node.expr[1].expr.length >= 3 &&
      node.expr[1].expr[0].token === '(' &&
      node.expr[1].expr[node.expr[1].expr.length - 1].token === ')' &&
      expr(node.expr[1].expr.slice(1, node.expr[1].expr.length - 1))
    ))
  ),

  combineCommaWithExpr: ast => (
    // flatten expr([expr([...]), token(,)]) into expr([..., token(,)])
    pop(ast, node => (
      node.type === 'expression' &&
      node.expr.length === 2 &&
      node.expr[0].type === 'expression' &&
      node.expr[1].token === ', ' && (
        node.expr[0].expr.length === 1 &&
        node.expr[0].expr[0].type === 'expression' && (
          node.expr[0].expr[0].length === 1 &&
          node.expr[0].expr[0].expr[0].type === 'expression' &&
          expr(node.expr[0].expr[0].expr[0].expr.concat(token(', '))) ||
          expr(node.expr[0].expr[0].expr.concat(token(', ')))
        ) ||
        expr(node.expr[0].expr.concat(token(', ')))
      )
    ))
  ),

  replaceMirrorAssignments: ast => {
    // remove assignments that are directly set from another local variable

    ast.depth = 0;
    any(ast, (node, i, parent) => {
      node.depth = parent.depth + 1;
    });

    pop(ast, node => (
      node.type === 'declare' &&
      any(ast, n => (
        n.type === 'declare' &&
        n.local === node.local &&
        n.depth < node.depth
      ))
    ));

    any(ast, (node, i, parent) => {
      if (node.expr && node.expr.length === 1 && node.expr[0].expr && node.expr[0].expr.find(n => n.type === 'declare')) {
        const declare = node.expr[0].expr && node.expr[0].expr.find(n => n.type === 'declare');
        let writes = 0;
        any(parent, (n, j, p) => {
          if (
            n.name === declare.local.name &&
            p.expr[j + 1] && p.expr[j + 1].token === ' = '
          ) {
            writes += 1;
          }
        });
        if (
          writes === 1 &&
          node.expr[0].expr.length === 4 && node.expr[0].expr[3].type === 'local'
        ) {
          const right = node.expr[0].expr[3].name;
          pop(parent, n => (
            n.name === declare.local.name &&
            local(right)
          ));
        }
      }
    });
  },

  removeEqualAssignments: ast => (
    pop(ast, (node, i, parent) => (
      node.type === 'expression' && (
        node.expr.length === 4 &&
        node.expr[1].type === 'local' &&
        node.expr[2].token === ' = ' &&
        node.expr[3].type === 'local' &&
        node.expr[1].name === node.expr[3].name ||
        node.expr.length === 3 &&
        node.expr[0].type === 'local' &&
        node.expr[1].token === ' = ' &&
        node.expr[2].type === 'local' &&
        node.expr[0].name === node.expr[2].name
      )
    ))
  ),
};

const ruleSets = {
  symantics: [
    'collapseExpressions',
    'collapseParantheses',
    'combineCommaWithExpr',
    'removeEqualAssignments'
  ],
  math: [
    'eliminateCanceledTerms',
    'eliminateMul0',
    'reduceAdd0',
    'reduceMul1',
  ],
  locals: [
    'removeUnusedLocals',
    'replaceMirrorAssignments',
  ],
};

/**
 *
 * @param options {object}
 * @param options.passes {number}
 * @param options.rules {string[]}
 * @param options.ruleSets {string[]}
 */
const compile = (node, options = {}) => {
  // given a function generator. call it with the stated arguments and compile
  // of a function that will generate a function that works the same as a fully
  // declared and inline-able function.
  if (typeof node === 'function') {
    node = a.func(node.args[0], [
      node(...node.args.slice(1)),
    ]);
  }
  else {
    node = a.func([], [node]);
  }

  const context = {
    _body: '',
    _pointer: [],
    pointer: null,
    stack: [],
    args: null,
    scope: {},
    locals: {},
    names: {},
    vars: [],
    options,
  };
  context.context = context;
  context.compile = _compile.bind(null, context);
  context.lookupScope = name => _compile_lookup(context.stack, context.scope, name);

  const ast = context.compile(node);

  // finally, create the function
  let f;
  try {
    f = new Function('return ' + ast.toString() + ';')();
  }
  catch (e) {
    console.log(e.stack || e);
    console.log(`${ast.toString()}`);
    // console.log(JSON.stringify(ast));
    throw e;
  }

  f.toAst = () => ast;

  return f;
};

module.exports = compile;
