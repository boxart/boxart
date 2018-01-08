const identity = function () {
  const f = function (state, element, data) {
    return element;
  };

  f.copy = function (dest, src) {
    return src;
  };

  f.merge = function (dest, src) {
    return src;
  };

  return f;
};

module.exports = identity;