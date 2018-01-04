function inlineSiblingFunction() {
  const f = function() {
    return 1;
  };
  const g = function() {
    return 2;
  };
  const h = function() {
    return f() + g();
  };
  return h;
}

module.exports = inlineSiblingFunction;
