function removeUnnecessaryAssignMember(fn) {
  const f = function (a) {
    a.s = 'def';
    return a;
  };
  return f;
}

module.exports = removeUnnecessaryAssignMember;