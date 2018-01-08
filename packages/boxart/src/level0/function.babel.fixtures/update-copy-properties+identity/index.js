function abProperties() {
  const identity = function () {
    const f = function(state, element, data) {
      return element;
    };
    f.copy = function(dest, src) {
      return dest;
    };
    return f;
  };

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
    a: identity(),
    b: identity(),
  });
}

module.exports = abProperties;
