const _identity = function () {
  const f = function (state, element, data) {
    return element;
  };
  f.copy = function (dest, src) {
    return dest;
  };
  return f;
};

module.exports = _identity;