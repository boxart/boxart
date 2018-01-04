const identity = function () {
  const f = function(state, element, data) {
    return element;
  };
  return f;
};

module.exports = identity;
