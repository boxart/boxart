const _union = function (ary) {
  const _f = function (state, element, data) {
    for (const _v of ary) {
      state = _v(state, element, data);
    }
    return state;
  };

  _f.copy = function (dest, src) {
    for (const _v2 of ary) {
      dest = _v2.copy ? _v2.copy(dest, src) : src;
    }return dest;
  };

  return _f;
};

module.exports = _union;