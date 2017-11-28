const object = function (o) {
  const f = function(t, state, begin, end, data) {
    data.stateParent = state;
    data.beginParent = begin;
    data.endParent = end;
    for (const k of Object.keys(o)) {
      state[k] = f.o[k](t, state[k], begin[k], end[k], data);
    }
    return state;
  };
  f.o = o;
  return f;
}

module.exports = object;
