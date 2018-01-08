const value = function (fn) {
  const f = function (element, state, data) {
    return fn(element, state, data);
  };

  f.store = function (store, element, data) {
    return fn.store ? fn.store(store, element, data) : element;
  };

  f.restore = function (element, store, data) {
    return fn.restore ? fn.restore(element, store, data) : store;
  };

  return f;
};

module.exports = value;