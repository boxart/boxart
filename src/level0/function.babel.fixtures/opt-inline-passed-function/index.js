function inlinePassedFunction() {
  const f = function(g) {
    return 'f' + g();
  };
  const g = function(h) {
    return 'g' + h();
  };
  const h = function() {
    return 'h';
  };
  const i = function(f) {
    const a = function() {
      return f();
    };
    return a;
  };
  return i(function() {return g(function() {return f(h);});});
}

module.exports = inlinePassedFunction;
