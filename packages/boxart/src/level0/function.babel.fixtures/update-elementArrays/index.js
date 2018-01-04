const elementArrays = function (obj) {
  const f = function (state, element, data) {
    state = state || {};
    for (const [k, v] of Object.entries(obj)) {
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
  return f;
};

module.exports = elementArrays;
