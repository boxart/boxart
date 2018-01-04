function binarySafeReorder() {
  const f = function (a) {
    const f = function () {
      return 5;
    };
    f.f = function () {
      return a + 5;
    };
    f.g = function () {
      return 6;
    };
    f.h = function () {
      return a * 6;
    };
    return f;
  };
  return f;
}

module.exports = binarySafeReorder;