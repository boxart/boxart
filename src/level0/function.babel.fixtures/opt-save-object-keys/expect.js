function explodeSaveObjectKeys() {
  const f = function (o) {
    const Object_keys_o = Object.keys(o);

    const f = function () {
      let s = '';
      for (const [k, v] of Object_keys_o) {
        s = v(k, s);
      }
      return s;
    };
    return f;
  };
  return f;
}

module.exports = explodeSaveObjectKeys;