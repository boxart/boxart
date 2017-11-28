const _value2 = function (fn) {
  const _f2 = function (state, element, data) {
    return fn(state, element, data);
  };

  _f2.copy = function (dest, src) {
    return fn.copy ? fn.copy(dest, src) : src;
  };

  return _f2;
};

module.exports = _value2;