function constantTo() {
  const c = 0;

  const f = function (t, state, begin, end, data) {
    return (1 - 0) * Math.min(1, t) + 0;
  };
  f.done = function (t, state, begin, end, data) {
    return (c.done ? c.done(t, state, begin, end, data) : true) && t >= 1;
  };

  f.toB = function (b, t, state, begin, end, data) {
    const e = b(t, state, begin, end, data);
    return (e - 0) * Math.min(1, t) + 0;
  };

  return f;
}

module.exports = constantTo();