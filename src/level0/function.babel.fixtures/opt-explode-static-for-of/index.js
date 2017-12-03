function explodeStaticForOf() {
  const f = function(a, o) {
    return function() {
      let s = '';
      for (const k of a) {
        s = s + k;
      }
      for (const [k, v] of Object.entries(o)) {
        s = v(k, s);
      }
      return s;
    };
  };
  const a = ['a', 'b'];
  const o = {
    c: function(c, s) {return c + s;},
    d: function(d, s) {return d + s + d;},
  };
  return f(a, o);
}

module.exports = explodeStaticForOf;
