const _constant2 = function (c) {
  const _f2 = function (t, state) {
    return c;
  };

  _f2.toB = function (b, t, state) {
    const _e3 = b(t, state);

    return (_e3 - c) * Math.min(1, t) + c;
  };

  _f2.done = function (t) {
    return (c.done ? c.done(t, state) : true) && t >= 1;
  };

  return _f2;
};

module.exports = _constant2;