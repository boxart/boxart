const union = function (ary) {
  const f = function (state, element, data) {
    for (const v of ary) {
      state = v(state, element, data);
    }
    return state;
  };

  f.copy = function (dest, src) {
    for (const v of ary) {
      dest = v.copy ? v.copy(dest, src) : src;
    }return dest;
  };

  f.merge = function (dest, src) {
    for (const v of ary) {
      dest = v.merge ? v.merge(dest, src) : src;
    }return dest;
  };

  return f;
};

module.exports = union;