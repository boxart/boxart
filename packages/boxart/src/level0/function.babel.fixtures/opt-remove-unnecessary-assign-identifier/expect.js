function removeUnnecessaryAssignIdentifier(fn, o) {
  const f = function (a, b, c) {
    let s = '';
    a(o);

    s = 'ghi' + c();
    return s;
  };
  return f;
}

module.exports = removeUnnecessaryAssignIdentifier;