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
    const f = function(t, state, begin, end, data) {
      const stateParent = data.stateParent;
      data.stateParent = state;
      for (const [k, v] of Object.entries(o)) {
        state[k] = v(t, state[k], begin[k], end[k], data);
      }
      data.stateParent = stateParent;
      return state;
    };
    f.o = o;
    f.toB = function(b, t, state, begin, end, data) {
      const stateParent = data.stateParent;
      data.stateParent = state;
      for (const [k, v] of Object.entries(o)) {
        state[k] = v.toB(b.o[k], t, state[k], begin[k], end[k], data);
      }
      data.stateParent = stateParent;
      return state;
    };
    f.done = function (t) {
      return t >= 1;
    };
    return f;
  };

  return object({
    top: to(constant(0), constant(1)),
    left: to(constant(1), constant(2)),
  });
}

module.exports = objectTo;
