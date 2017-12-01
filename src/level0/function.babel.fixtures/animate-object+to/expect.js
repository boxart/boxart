function objectTo() {
  const f = function (t, state, begin, end, data) {
    return (1 - 0) * Math.min(1, t) + 0;
  };
  f.done = function (t, state, begin, end, data) {
    return true && t >= 1;
  };

  f.toB = function (b, t, state, begin, end, data) {
    const e = b(t, state, begin, end, data);
    return (e - 0) * Math.min(1, t) + 0;
  };

  const _f1 = function (t, state, begin, end, data) {
    return (2 - 1) * Math.min(1, t) + 1;
  };_f1.done = function (t, state, begin, end, data) {
    return true && t >= 1;
  };
  _f1.toB = function (b, t, state, begin, end, data) {
    const e = b(t, state, begin, end, data);
    return (e - 1) * Math.min(1, t) + 1;
  };

  const _f2 = function (t, state, begin, end, data) {
    state.top = (1 - 0) * Math.min(1, t) + 0;
    state.left = (2 - 1) * Math.min(1, t) + 1;
    return state;
  };
  _f2.o = {
    top: f,
    left: _f1
  };
  _f2.toB = function (b, t, state, begin, end, data) {
    const stateParent = data.stateParent;
    data.stateParent = state;
    const e = b.o.top(t, state.top, begin.top, end.top, data);

    state.top = (e - 0) * Math.min(1, t) + 0;

    const _e1 = b.o.left(t, state.left, begin.left, end.left, data);

    state.left = (_e1 - 1) * Math.min(1, t) + 1;
    data.stateParent = stateParent;
    return state;
  };
  _f2.done = function (t) {
    return t >= 1;
  };


  return _f2;
}

module.exports = objectTo();