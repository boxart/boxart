const SPACE = 32;
const ASTERICK = 42;
const EOF = 0;

class PatternSearch {
  constructor() {
    this.patterns = [];
    this._dirty = true;
    this.code = [];
    this.answers = [];
  }

  add(pattern) {
    this.patterns.push({
      pattern: pattern,
      chars: pattern + '\0',
      codes: (pattern + '\0').split('')
      .map(a => a.charCodeAt(0)),
    });

    this._dirty = true;

    return this;
  }

  rebuild() {
    const tree = {};
    const flat = [];
    const answers = [];

    for (let i = 0; i < this.patterns.length; i++) {
      const p = this.patterns[i];
      let node = tree;
      for (let j = 0; j < p.codes.length - 1; j++) {
        const c = p.codes[j];
        if (c !== ASTERICK) {
          node = node[c] = node[c] || {};
        }
        else {
          const wildNode = {};
          const wildStack = [[node, Object.keys(node), 0]];
          while (wildStack.length) {
            const memory = wildStack.pop();
            node = memory[0];
            const keys = memory[1];
            const k = memory[2];
            if (k < keys.length) {
              const child = node[keys[k]];
              wildStack.push([node, keys, k + 1]);
              if (!child.pattern) {
                wildStack.push([child, Object.keys(child), 0]);
              }
            }
            else {
              node = node[ASTERICK] = wildNode;
            }
          }
        }
      }
      node[SPACE] = p;
      node[EOF] = p;
    }

    let j = flat.length;

    let entries = Object.entries(tree);
    for (let i = 0; i < entries.length; i++) {
      flat[j++] = entries[i][0];
      flat[j++] = entries[i][1];
    }
    flat[j++] = -1;
    flat[j++] = -1;

    let i = 0;
    while (i < flat.length) {
      const node = flat[i + 1];
      if (node === -1) {
        i += 2;
        continue;
      }
      if (node.pattern) {
        flat[i + 1] = -answers.length;
        answers.push(node.pattern);
        i += 2;
        continue;
      }
      flat[i + 1] = j;
      entries = Object.entries(node);
      entries.sort(([a], [b]) => (
        Number(a) === ASTERICK ? 1 :
        Number(b) === ASTERICK ? -1 :
        Number(a) - Number(b)
      ));
      for (let k = 0; k < entries.length; k++) {
        flat[j++] = entries[k][0];
        flat[j++] = entries[k][1];
      }
      flat[j++] = -1;
      flat[j++] = -1;
      i += 2;
    }

    this.code = new Int32Array(flat);
    this.answers = answers;

    this._dirty = false;
  }

  search(str, begin, end) {
    if (this._dirty) {
      if (this.patterns.length === 0) {
        return false;
      }
      this.rebuild();
    }

    this.begin = begin || 0;
    this.end = begin || 0;
    const _str = str + '\0';
    const {code} = this;
    let ptr = 0;
    for (let i = begin || 0, l = end || _str.length; i < l; ++i) {
      let _code = _str.charCodeAt(i);
      if (code[ptr] === _code) {
        if (code[ptr + 1] <= 0) {
          this.end = i;
          return this.answers[-code[ptr + 1]];
        }
        ptr = code[ptr + 1];
      }
      else if (code[ptr] === ASTERICK && _code !== SPACE && _code !== EOF) {
        ptr = code[ptr + 1];
        while (
          ++i < l &&
          (_code = _str.charCodeAt(i)) !== SPACE &&
          _code !== EOF
        );
        --i;
      }
      else {
        --i;
        ptr += 2;
        if (code[ptr] === -1) {
          ptr = 0;
          while (++i < l && _str.charCodeAt(i) !== SPACE);
          this.begin = i + 1;
        }
      }
    }
    return false;
  }
}

// export default PatternSearch;
module.exports = PatternSearch;
