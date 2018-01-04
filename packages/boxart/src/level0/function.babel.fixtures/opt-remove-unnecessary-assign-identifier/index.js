function removeUnnecessaryAssignIdentifier(fn, o) {
  const f = function(a, b, c) {
    let s = '';
    s = 'abc' + a(o);
    s = 'def' + b();
    s = 'ghi' + c();
    return s;
  };
  return f;
}

module.exports = removeUnnecessaryAssignIdentifier;
