const constant = function (c) {
  const f = function(t, state) {
    return c;
  };
  return f;
}

module.exports = constant;
