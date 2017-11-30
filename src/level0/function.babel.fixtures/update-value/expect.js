const _value = function (fn) {
  const _f = function (state, element, data) {
    return fn(state, element, data);
  };

  _f.copy = function (dest, src) {
    return fn.copy ? fn.copy(dest, src) : src;
  };

  return _f;
};

module.exports = _value;