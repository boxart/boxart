const union = function (ary) {
  const f = function(state, element, data) {
    for (const v of ary) {
      state = v(state, element, data);
    }
    return state;
  };
  return f;
};

module.exports = union;
