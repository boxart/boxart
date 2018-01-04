function constantTo() {
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

  return to(constant(0), constant(1));
}

module.exports = constantTo();
