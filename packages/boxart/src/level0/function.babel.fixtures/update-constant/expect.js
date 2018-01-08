const constant = function (c) {
  const f = function (state, element, data) {
    return c;
  };

  f.copy = function (dest, src) {
    return src;
  };

  f.merge = function (dest, src) {
    return src;
  };

  return f;
};

module.exports = constant;