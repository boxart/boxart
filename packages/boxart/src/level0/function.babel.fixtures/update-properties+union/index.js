function unionProperties() {
  const value = function (fn) {
    const f = function(state, element, data) {
      return fn(state, element, data);
    };
    return f;
  };

  const union = function (ary) {
    const f = function(state, element, data) {
      for (const v of ary) {
        state = v(state, element, data);
      }
      return state;
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
    u: union([
      value(function(state, element) {
        return element;
      }),
      value(function(state, element) {
        return element;
      }),
    ]),
  });
}

module.exports = unionProperties();
