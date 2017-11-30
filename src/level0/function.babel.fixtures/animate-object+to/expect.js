function objectTo() {
  const _c13 = 0;

  const _f31 = function (t, state, begin, end, data) {
    return (1 - 0) * Math.min(1, t) + 0;
  };
  _f31.done = function (t, state, begin, end, data) {
    const _t106 = t;

    return (_c13.done ? _c13.done(t, state, begin, end, data) : true) && _t106 >= 1;
  };

  _f31.toB = function (b, t, state, begin, end, data) {
    const _t26 = t;

    const _e10 = b(t, state, begin, end, data);

    return (_e10 - 0) * Math.min(1, _t26) + 0;
  };

  const _c15 = 1;
  const _f34 = function (t, state, begin, end, data) {
    return (2 - 1) * Math.min(1, t) + 1;
  };_f34.done = function (t, state, begin, end, data) {
    const _t116 = t;
    return (_c15.done ? _c15.done(t, state, begin, end, data) : true) && _t116 >= 1;
  };
  _f34.toB = function (b, t, state, begin, end, data) {
    const _t42 = t;

    const _e14 = b(t, state, begin, end, data);

    return (_e14 - 1) * Math.min(1, _t42) + 1;
  };

  const _f4 = function (t, state, begin, end, data) {
    const _stateParent13 = data.stateParent;
    data.stateParent = state;

    state.top = (1 - 0) * Math.min(1, t) + 0;
    state.left = (2 - 1) * Math.min(1, t) + 1;
    data.stateParent = _stateParent13;
    return state;
  };
  _f4.o = {
    top: _f31,
    left: _f34
  };
  _f4.toB = function (b, t, state, begin, end, data) {
    const _stateParent14 = data.stateParent;
    data.stateParent = state;
    const _t127 = t;

    const _e36 = b.o.top(t, state.top, begin.top, end.top, data);

    state.top = (_e36 - 0) * Math.min(1, _t127) + 0;
    const _t89 = t;

    const _e26 = b.o.left(t, state.left, begin.left, end.left, data);

    state.left = (_e26 - 1) * Math.min(1, _t89) + 1;
    data.stateParent = _stateParent14;
    return state;
  };
  _f4.done = function (t) {
    return t >= 1;
  };


  return _f4;
}

module.exports = objectTo();