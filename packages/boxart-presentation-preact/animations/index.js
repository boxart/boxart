const _animations = require.context('.');

_animations.keys()
.filter(key => /\/(.+)\/index\.js$/.test(key))
.forEach(key => {
  console.log(key, /\/(.+)[/.]/.exec(key), null);
  const member = /\/([^/.]+)[/.]/.exec(key)[1];
  console.log(_animations(key));
  exports[member] = _animations(key);
});
console.log(exports);
