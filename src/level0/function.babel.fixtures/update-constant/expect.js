const _constant = function (c) {
  const _f = function (state, element, data) {
    return c;
  };

  _f.copy = function (dest, src) {
    return src;
  };

  return _f;
};

module.exports = _constant;