const _union2 = function (ary) {
  const _f2 = function (state, element, data) {
    for (const _v3 of ary) {
      state = _v3(state, element, data);
    }
    return state;
  };

  _f2.copy = function (dest, src) {
    for (const _v4 of ary) {
      dest = _v4.copy ? _v4.copy(dest, src) : src;
    }return dest;
  };

  return _f2;
};

module.exports = _union2;