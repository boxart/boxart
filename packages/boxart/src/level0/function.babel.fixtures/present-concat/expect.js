const concat = function (fns) {
  const f = function (element, state, data) {
    let s = '';
    for (const v of fns) {
      s = s + v(element, state, data);
    }
    return s;
  };

  f.store = function (store, element, data) {
    return fns.store ? fns.store(store, element, data) : element;
  };

  f.restore = function (element, store, data) {
    return fns.restore ? fns.restore(element, store, data) : store;
  };

  return f;
};

module.exports = concat;