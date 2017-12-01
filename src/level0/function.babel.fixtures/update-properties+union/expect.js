function unionProperties() {
  const f = function (state, element, data) {
    state = state || {};

    state.u = element.u;

    return state;
  };

  f.copy = function (dest, src) {
    dest = dest || {};
    dest.u = src.u;
    return dest;
  };

  return f;
}

module.exports = unionProperties();