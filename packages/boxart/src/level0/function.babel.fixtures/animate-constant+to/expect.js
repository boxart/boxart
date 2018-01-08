function constantTo() {
  const f = function (t, state, begin, end, data) {
    return 1 * Math.min(1, t) + 0;
  };
  f.done = function (t, state, begin, end, data) {
    return true && t >= 1;
  };

  f.toB = function (b, t, state, begin, end, data) {
    const e = b(t, state, begin, end, data);
    return (e - 0) * Math.min(1, t) + 0;
  };

  return f;
}

module.exports = constantTo;