function objectProperty() {
  const f = function (state, element, data) {
    state = state || {};
    const _element1 = element;

    state.left = _element1.left;
    const _element2 = element;
    state.top = _element2.top;const _element3 = element;
    state.opacity = _element3.opacity;;
    return state;
  };

  f.copy = function (dest, src) {
    dest = dest || {};
    dest.left = src.left;
    dest.top = src.top;
    dest.opacity = src.opacity;
    return dest;
  };

  f.merge = function (dest, src) {
    dest = dest || {};
    dest.left = src.left;
    dest.top = src.top;
    dest.opacity = src.opacity;
    return dest;
  };

  return f;
}

module.exports = objectProperty;