const _properties2 = function (obj) {
  const __Object_entries_obj = Object.entries(obj);

  const _f2 = function (state, element, data) {
    state = state || {};
    for (const [k, v] of __Object_entries_obj) {
      state[k] = v(state[k], element[k], data);
    }
    return state;
  };

  _f2.copy = function (dest, src) {
    dest = dest || {};
    for (const [k, v] of __Object_entries_obj) {
      dest[k] = v.copy ? v.copy(dest[k], src[k]) : src[k];
    }return dest;
  };

  return _f2;
};

module.exports = _properties2;