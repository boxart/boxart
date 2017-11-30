function constantToEasing() {
  const _easing4 = function (t, state, begin, end, data) {
    const _t55 = t / 2;

    return (1 - 0) * Math.min(1, _t55) + 0;
  };
  _easing4.toB = function (b, t, state, begin, end, data) {
    const _t57 = t / 2;

    const _e10 = b(_t57, state, begin, end, data);

    return (_e10 - 0) * Math.min(1, _t57) + 0;
  };
  _easing4.done = function (t, state, begin, end, data) {
    return t / 2 >= 1;
  };


  return _easing4;
}

module.exports = constantToEasing();