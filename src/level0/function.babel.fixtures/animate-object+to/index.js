function objectTo() {
  const constant = function (c) {
    const f = function(t, state, begin, end, data) {
      return c;
    };
    return f;
  };

  const to = function (a, b) {
    const f = function(t, state, begin, end, data) {
      return a.toB(b, t, state, begin, end, data);
    };
    f.done = function(t, state, begin, end, data) {
      return a.done ? a.done(t, state, begin, end, data) : t >= 1;
    };
    return f;
  };

  const object = function (o) {
    let f = function(t, state, begin, end, data) {
      for (const [k, v] of Object.entries(o)) {
        state[k] = v(t, state[k], begin[k], end[k], data);
      }
      return state;
    };
    f.o = o;
    f.toB = function(b, t, state, begin, end, data) {
      for (const [k, v] of Object.entries(o)) {
        state[k] = v.toB(b.o[k], t, state[k], begin[k], end[k], data);
      }
      return state;
    };
    return f;
  };

  return object({
    top: to(constant(0), constant(1)),
    left: to(constant(1), constant(2)),
  });
}

module.exports = objectTo();
