function constantTo() {
  const _f3 = function (t, state, begin, end, data) {
    const _t33 = t;

    return (1 - 0) * Math.min(1, _t33) + 0;
  };
  _f3.done = function (t, state, begin, end, data) {
    const _t35 = t;

    return _t35 >= 1;
  };

  _f3.toB = function (b, t, state, begin, end, data) {
    const _b21 = b;
    const _t36 = t;
    const _state21 = state;
    const _begin21 = begin;
    const _end21 = end;
    const _data21 = data;
    const _t22 = t;

    const _e8 = _b21(_t36, _state21, _begin21, _end21, _data21);

    return (_e8 - 0) * Math.min(1, _t22) + 0;
  };

  return _f3;
}

module.exports = constantTo();