function binarySafeReorder() {
  const f = function(a) {
    const f = function() {
      return 2 + 3;
    };
    f.f = function() {
      return (a + 2) + 3;
    };
    f.g = function() {
      return 2 * 3;
    };
    f.h = function() {
      return (a * 2) * 3;
    };
    return f;
  };
  return f;
}

module.exports = binarySafeReorder;
