function inlinePassedFunction() {
  const a = function () {
    return 'gfh';
  };

  return a;
}

module.exports = inlinePassedFunction;