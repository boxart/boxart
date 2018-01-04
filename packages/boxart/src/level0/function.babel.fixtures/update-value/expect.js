const _value = function (fn) {
  const f = function (state, element, data) {
    return fn(state, element, data);
  };

  f.copy = function (dest, src) {
    return fn.copy ? fn.copy(dest, src) : src;
  };

  return f;
};

module.exports = _value;