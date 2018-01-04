const _constant3 = function (c) {
  const f = function (t, state) {
    return c;
  };

  f.toB = function (b, t, state) {
    const e = b(t, state);
    return (e - c) * Math.min(1, t) + c;
  };

  f.done = function (t) {
    return (c.done ? c.done(t, state) : true) && t >= 1;
  };

  return f;
};

module.exports = _constant3;