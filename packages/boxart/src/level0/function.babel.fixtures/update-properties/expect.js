const properties = function (obj) {
  const Object_entries_obj = Object.entries(obj);

  const f = function (state, element, data) {
    state = state || {};
    for (const [k, v] of Object_entries_obj) {
      state[k] = v(state[k], element[k], data);
    }
    return state;
  };

  f.copy = function (dest, src) {
    dest = dest || {};
    for (const [k, v] of Object_entries_obj) {
      dest[k] = v.copy ? v.copy(dest[k], src[k]) : src[k];
    }return dest;
  };

  f.merge = function (dest, src) {
    dest = dest || {};
    for (const [k, v] of Object_entries_obj) {
      dest[k] = v.merge ? v.merge(dest[k], src[k]) : src[k];
    }return dest;
  };

  return f;
};

module.exports = properties;