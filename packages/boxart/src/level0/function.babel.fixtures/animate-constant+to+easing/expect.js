function constantToEasing() {
  const easing = function (t, state, begin, end, data) {
    const _t1 = t / 2;

    return 1 * Math.min(1, _t1) + 0;
  };
  easing.toB = function (b, t, state, begin, end, data) {
    const _t1 = t / 2;

    const e = b(_t1, state, begin, end, data);

    return (e - 0) * Math.min(1, _t1) + 0;
  };
  easing.done = function (t, state, begin, end, data) {
    return t / 2 >= 1;
  };


  return easing;
}

module.exports = constantToEasing;