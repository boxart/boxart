const constant = function (c) {
  const f = function(state, element, data) {
    return c;
  };
  return f;
}

module.exports = constant;
