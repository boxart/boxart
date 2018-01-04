function constantToEasing() {
  const constant = function (c) {
    const f = function(t, state, begin, end, data) {
      return c;
    };
    return f;
  };

  const easing = function (a, fn) {
    const _easing = function(t, state, begin, end, data) {
      return a(fn(t, state, begin, end, data), state, begin, end, data);
    };
    _easing.toB = function(b, t, state, begin, end, data) {
      return a.toB(b, fn(t, state, begin, end, data), state, begin, end, data);
    };
    _easing.done = function(t, state, begin, end, data) {
      return fn(t, state, begin, end, data) >= 1;
    };
    return _easing;
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

  return easing(
    to(constant(0), constant(1)),
    function(t) {
      return t / 2;
    }
  );
}

module.exports = constantToEasing();
