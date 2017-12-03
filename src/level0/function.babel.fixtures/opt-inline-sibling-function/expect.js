function inlineSiblingFunction() {
  const h = function () {
    return 3;
  };
  return h;
}

module.exports = inlineSiblingFunction;