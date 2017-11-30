const value = function (fn) {
  const f = function(element, state, data) {
    return fn(element, state, data);
  };
  return f;
}

module.exports = value;
