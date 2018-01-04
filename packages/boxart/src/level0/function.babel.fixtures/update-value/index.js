const value = function (fn) {
  const f = function(state, element, data) {
    return fn(state, element, data);
  };
  return f;
}

module.exports = value;
