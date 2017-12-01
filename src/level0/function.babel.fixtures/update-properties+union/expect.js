function unionProperties() {
  const f = function (state, element, data) {
    state = state || {};
    let _state1 = state.u;
    {
      _state1 = element.u;
      _state1 = element.u;
    }

    state.u = element.u;

    return state;
  };

  f.copy = function (dest, src) {
    dest = dest || {};
    {}
    dest.u = src.u;
    return dest;
  };

  return f;
}

module.exports = unionProperties();