function abProperties() {
  const f = function (state, element, data) {
    state = state || {};

    state.a = element.a;
    state.b = element.b;
    return state;
  };

  f.copy = function (dest, src) {
    dest = dest || {};
    return dest;
  };

  return f;
}

module.exports = abProperties();