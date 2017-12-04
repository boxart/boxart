function explodeStaticIf() {
  const f = function(b, g) {
    return function() {
      let s = '';
      if (b) {
        s = 'bt';
      }
      if (g.f) {
        s = s + 'ft';
      }
      else {
        s = s + 'ff';
      }
      if (g.g) {
        s = s + 'gt';
      }
      else {
        s = s + 'gf'
      }
      if (g.h) {
        s = s + 'ht';
      }
      return s;
    };
  };
  const g = function() {};
  g.g = function() {};
  g.h = function() {};
  return f(true, g);
}

module.exports = explodeStaticIf;
