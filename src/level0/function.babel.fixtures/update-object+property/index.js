function objectProperty() {
  const property = function(name) {
    const f = function(state, element, data) {
      return element[name];
    };
    return f;
  };

  const object = function(o) {
    const f = function(state, element, data) {
      state = state || {};
      for (const [k, v] of Object.entries(o)) {
        state[k] = o[k](state[k], element, data);
      };
      return state;
    };
    return f;
  };

  return object({
    left: property('left'),
    top: property('top'),
    opacity: property('opacity'),
  });
}

module.exports = objectProperty();
