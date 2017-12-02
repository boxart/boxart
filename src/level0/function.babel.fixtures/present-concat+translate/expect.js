function concatTranslate() {
  const f = function (element, state, data) {
    let s = '';
    let _s1 = '';const _state1 = state;

    _s1 = 'translate(' + (_state1.left + 'px');
    _s1 = _s1 + ', ';const _state2 = state;
    _s1 = _s1 + (_state2.top + 'px');_s1 = _s1 + ')';s = '' + _s1;s = s + ' ';s = s + 'scale(1, 2)';
    return s;
  };

  f.store = function (store, element, data) {
    return element;
  };

  f.restore = function (element, store, data) {
    return store;
  };

  return f;
}

module.exports = concatTranslate();