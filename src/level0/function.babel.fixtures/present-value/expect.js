const _value = function (fn) {
  const _f = function (element, state, data) {
    return fn(element, state, data);
  };

  _f.store = function (store, element, data) {
    return fn.store ? fn.store(store, element, data) : element;
  };

  _f.restore = function (element, store, data) {
    return fn.restore ? fn.restore(element, store, data) : store;
  };

  return _f;
};

module.exports = _value;