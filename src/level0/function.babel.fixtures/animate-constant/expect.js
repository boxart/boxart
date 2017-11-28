const _constant2 = function (c) {
  const _f2 = function (t, state) {
    return c;
  };

  _f2.toB = function (b, t, state) {
    const _t6 = t;
    const _b3 = c;

    const _e3 = b(t, state);

    return (_e3 - _b3) * Math.min(1, _t6) + _b3;
  };

  _f2.done = function (t) {
    return t >= 1;
  };

  return _f2;
};

module.exports = _constant2;