function abProperties() {
  const _f3 = function (state, element, data) {
    state = state || {};

    state.a = element.a;
    state.b = element.b;
    return state;
  };

  _f3.copy = function (dest, src) {
    dest = dest || {};
    dest.a = src.a;
    dest.b = src.b;
    return dest;
  };

  return _f3;
}

module.exports = abProperties();