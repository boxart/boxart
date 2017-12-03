function stopCacheAfterAssign(fn) {
  const o = {};
  o.s = '';
  const f = function() {
    return 'constant';
  };
  f.o = o;
  return f;
}

module.exports = stopCacheAfterAssign;
