const _elementArrays2 = function (obj) {
  const __Object_entries_obj = Object.entries(obj);

  const _f2 = function (state, element, data) {
    state = state || {};
    for (const [k, v] of __Object_entries_obj) {
      const _elements2 = element.getElementsByClassName(k);

      const _elementCopy2 = data.animated[k] || [];
      const _elementState2 = state[k] || [];
      _elementCopy2.length = _elements2.length;
      _elementState2.length = _elements2.length;
      for (let _i3 = 0; _i3 < _elementState2.length; _i3++) {
        _elementCopy2[_i3] = _elements2[_i3];
        _elementState2[_i3] = v(_elementState2[_i3], _elementCopy2[_i3], data);
      }
      data.animated[k] = _elementCopy2;
      state[k] = _elementState2;
    }
    return state;
  };

  _f2.copy = function (dest, src) {
    dest = dest || {};
    for (const [k, v] of __Object_entries_obj) {
      const _dest2 = dest[k] || [];

      const _src2 = src[k] || [];

      _dest2.length = _src2.length;
      for (let _i4 = 0; _i4 < _src2.length; _i4++) {
        _dest2[_i4] = v.copy ? v.copy(_dest2[_i4], _src2[_i4]) : _src2[_i4];
      }dest[k] = _dest2;
    }return dest;
  };

  return _f2;
};

module.exports = _elementArrays2;