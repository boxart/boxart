function unionProperties() {
  const _f4 = function (state, element, data) {
    state = state || {};
    let _state19 = state.u;
    {
      _state19 = element.u;
      _state19 = element.u;
    }

    state.u = _state19;

    return state;
  };

  _f4.copy = function (dest, src) {
    dest = dest || {};
    let _dest8 = dest.u;
    {
      _dest8 = src.u;
      _dest8 = src.u;
    }
    dest.u = _dest8;
    return dest;
  };

  return _f4;
}

module.exports = unionProperties();