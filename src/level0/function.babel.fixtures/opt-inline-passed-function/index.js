function inlinePassedFunction() {
  const f = function(g) {
    return 'f' + g();
  };
  const g = function(h) {
    return 'g' + h.h();
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
  const j = function() {return h();};
  j.h = function() {return f(h);};
  return i(function() {return g(j);});
}

module.exports = inlinePassedFunction;
