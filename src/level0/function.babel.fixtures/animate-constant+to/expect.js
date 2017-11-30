function constantTo() {
  const _c5 = 0;

  const _f3 = function (t, state, begin, end, data) {
    return (1 - 0) * Math.min(1, t) + 0;
  };
  _f3.done = function (t, state, begin, end, data) {
    const _t35 = t;

    return (_c5.done ? _c5.done(t, state, begin, end, data) : true) && _t35 >= 1;
  };

  _f3.toB = function (b, t, state, begin, end, data) {
    const _t22 = t;

    const _e8 = b(t, state, begin, end, data);

    return (_e8 - 0) * Math.min(1, _t22) + 0;
  };

  return _f3;
}

module.exports = constantTo();