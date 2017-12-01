const _elementArrays2 = function (obj) {
  const _Object_entries_obj = Object.entries(obj);

  const f = function (state, element, data) {
    state = state || {};
    for (const [k, v] of _Object_entries_obj) {
      const elements = element.getElementsByClassName(k);

      const elementCopy = data.animated[k] || [];
      const elementState = state[k] || [];
      elementCopy.length = elements.length;
      elementState.length = elements.length;
      for (let i = 0; i < elementState.length; i++) {
        elementCopy[i] = elements[i];
        elementState[i] = v(elementState[i], elementCopy[i], data);
      }
      data.animated[k] = elementCopy;
      state[k] = elementState;
    }
    return state;
  };

  f.copy = function (dest, src) {
    dest = dest || {};
    for (const [k, v] of _Object_entries_obj) {
      const _dest1 = dest[k] || [];

      const _src1 = src[k] || [];

      _dest1.length = _src1.length;
      for (let i = 0; i < _src1.length; i++) {
        _dest1[i] = v.copy ? v.copy(_dest1[i], _src1[i]) : _src1[i];
      }dest[k] = _dest1;
    }return dest;
  };

  return f;
};

module.exports = _elementArrays2;