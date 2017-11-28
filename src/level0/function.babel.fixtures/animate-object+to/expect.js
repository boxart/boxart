const _object2 = function (o) {
  const __Object_keys_o = Object.keys(o);

  const _f2 = function (t, state, begin, end, data) {
    data.stateParent = state;
    data.beginParent = begin;
    data.endParent = end;
    for (const _k3 of __Object_keys_o) {
      state[_k3] = _f2.o[_k3](t, state[_k3], begin[_k3], end[_k3], data);
    }
    return state;
  };
  _f2.o = o;

  _f2.toB = function (b, t, state, begin, end, data) {
    data.stateParent = state;data.beginParent = begin;data.endParent = end;for (const _k4 of __Object_keys_o) {
      let _result;

      if (_f2.o[_k4].toB) {
        _result = _f2.o[_k4].toB(b.o[_k4], t, state[_k4], begin[_k4], end[_k4], data);
      } else {
        const _t4 = t;

        const _b4 = _f2.o[_k4](t, state[_k4], begin[_k4], end[_k4], data);

        const _e4 = b.o[_k4](t, state[_k4], begin[_k4], end[_k4], data);

        _result = (_e4 - _b4) * Math.min(1, _t4) + _b4;
      }

      state[_k4] = _result;
    }return state;
  };

  _f2.done = function (t) {
    return t >= 1;
  };

  return _f2;
};

module.exports = _object2;