function explodeSaveObjectKeys() {
  const f = function (o) {
    const Object_entries_o = Object.entries(o);

    const f = function () {
      let s = '';
      for (const [k, v] of Object_entries_o) {
        s = v(k, s);
      }
      return s;
    };
    return f;
  };
  return f;
}

module.exports = explodeSaveObjectKeys;