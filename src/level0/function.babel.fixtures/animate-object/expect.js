const _object3 = function (o) {
  const _Object_keys_o = Object.keys(o);

  const f = function (t, state, begin, end, data) {
    data.stateParent = state;
    data.beginParent = begin;
    data.endParent = end;
    for (const k of _Object_keys_o) {
      state[k] = f.o[k](t, state[k], begin[k], end[k], data);
    }
    return state;
  };
  f.o = o;

  f.toB = function (b, t, state, begin, end, data) {
    data.stateParent = state;data.beginParent = begin;data.endParent = end;for (const k of _Object_keys_o) {
      let result;

      if (f.o[k].toB) {
        result = f.o[k].toB(b.o[k], t, state[k], begin[k], end[k], data);
      } else {
        const _b1 = f.o[k](t, state[k], begin[k], end[k], data);

        const e = b.o[k](t, state[k], begin[k], end[k], data);
        result = (e - _b1) * Math.min(1, t) + _b1;
      }

      state[k] = result;
    }return state;
  };

  f.done = function (t) {
    return (o.done ? o.done(t, state, begin, end, data) : true) && t >= 1;
  };

  return f;
};

module.exports = _object3;