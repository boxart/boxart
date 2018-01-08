function concatTranslate() {
  const concat = function (fns) {
    const f = function(element, state, data) {
      let s = '';
      for (const v of fns) {
        s = s + v(element, state, data);
      }
      return s;
    };
    return f;
  };

  const constant = function(str) {
    const f = function(element, state, data) {
      return str;
    };
    return f;
  };

  const c = constant;

  const key = function (k) {
    const f = function(element, state, data) {
      return state[k];
    };
    return f;
  };

  const px = function (v) {
    const f = function (element, state, data) {
      return v(element, state, data) + 'px';
    };
    return f;
  };

  const func = function (name, fns) {
    return concat([
      name,
      c('('),
      fns[0],
      c(', '),
      fns[1],
      c(')'),
    ]);
  };

  const translate = function(fns) {
    const f = func(c('translate'), fns);
    return f;
  };

  return concat([
    translate([px(key('left')), px(key('top'))]),
    c(' '),
    func(c('scale'), [c(1), c(2)])
  ]);
}

module.exports = concatTranslate;
