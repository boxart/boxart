const concat = function (fns) {
  const f = function(element, state, data) {
    let s = '';
    for (const v of fns) {
      s = s + v(element, state, data);
    }
    return s;
  };
  return f;
}

module.exports = concat;
