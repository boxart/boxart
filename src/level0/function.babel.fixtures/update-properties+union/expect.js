function unionProperties() {
  const _f4 = function (state, element, data) {
    state = state || {};
    let _state29 = state.u;
    {
      _state29 = element.u;
      _state29 = element.u;
    }

    state.u = _state29;

    return state;
  };

  _f4.copy = function (dest, src) {
    dest = dest || {};
    let _dest13 = dest.u;
    {
      _dest13 = src.u;
      _dest13 = src.u;
    }
    dest.u = _dest13;
    return dest;
  };

  return _f4;
}

module.exports = unionProperties();