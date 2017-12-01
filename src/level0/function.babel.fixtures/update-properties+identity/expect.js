function abProperties() {
  const f = function (state, element, data) {
    state = state || {};

    state.a = element.a;
    state.b = element.b;
    return state;
  };

  f.copy = function (dest, src) {
    dest = dest || {};
    dest.a = src.a;
    dest.b = src.b;
    return dest;
  };

  return f;
}

module.exports = abProperties();