const _identity = function () {
  const _f = function (state, element, data) {
    return element;
  };
  _f.copy = function (dest, src) {
    return dest;
  };
  return _f;
};

module.exports = _identity;