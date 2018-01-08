function abProperties() {
  const value = function (fn) {
    const f = function(state, element, data) {
      return fn(state, element, data);
    };
    return f;
  }

  const properties = function (obj) {
    const f = function(state, element, data) {
      state = state || {};
      for (const [k, v] of Object.entries(obj)) {
        state[k] = v(state[k], element[k], data);
      }
      return state;
    };
    return f;
  };

  return properties({
    a: value(function(state, element) {
      return element;
    }),
    b: value(function(state, element) {
      return element;
    }),
  });
}

module.exports = abProperties;
