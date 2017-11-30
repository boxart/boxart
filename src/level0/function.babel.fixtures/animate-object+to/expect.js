function objectTo() {
  const _c25 = 0;

  const _f43 = function (t, state, begin, end, data) {
    return (1 - 0) * Math.min(1, t) + 0;
  };
  _f43.done = function (t, state, begin, end, data) {
    return (_c25.done ? _c25.done(t, state, begin, end, data) : true) && t >= 1;
  };

  _f43.toB = function (b, t, state, begin, end, data) {
    const _e10 = b(t, state, begin, end, data);

    return (_e10 - 0) * Math.min(1, t) + 0;
  };

  const _c26 = 1;
  const _f44 = function (t, state, begin, end, data) {
    return (2 - 1) * Math.min(1, t) + 1;
  };_f44.done = function (t, state, begin, end, data) {
    return (_c26.done ? _c26.done(t, state, begin, end, data) : true) && t >= 1;
  };
  _f44.toB = function (b, t, state, begin, end, data) {
    const _e14 = b(t, state, begin, end, data);

    return (_e14 - 1) * Math.min(1, t) + 1;
  };

  const _f4 = function (t, state, begin, end, data) {
    state.top = (1 - 0) * Math.min(1, t) + 0;
    state.left = (2 - 1) * Math.min(1, t) + 1;
    return state;
  };
  _f4.o = {
    top: _f43,
    left: _f44
  };
  _f4.toB = function (b, t, state, begin, end, data) {
    const _stateParent23 = data.stateParent;
    data.stateParent = state;

    const _e41 = b.o.top(t, state.top, begin.top, end.top, data);

    state.top = (_e41 - 0) * Math.min(1, t) + 0;

    const _e26 = b.o.left(t, state.left, begin.left, end.left, data);

    state.left = (_e26 - 1) * Math.min(1, t) + 1;
    data.stateParent = _stateParent23;
    return state;
  };
  _f4.done = function (t) {
    return t >= 1;
  };


  return _f4;
}

module.exports = objectTo();