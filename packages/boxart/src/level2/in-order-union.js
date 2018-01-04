const table = {};
const _d = [];
const isEqual = (a, b) => {
  if (a.length === b.length) {
    let isEqual = true;
    for (let i = 0; isEqual && i < a.length; ++i) {
      isEqual = a[i] === b[i];
    }
    return isEqual;
  }
  return false;
};
const buildTable = (a, b) => {
  for (let j = 0, l = a.length; j < l; ++j) {
    table[a[j]] = -1;
  }
  for (let j = 0, l = b.length; j < l; ++j) {
    table[b[j]] = j;
  }
};
const isAll = (a, b) => {
  let all = true;
  for (let j = 0; all && j < a.length; ++j) {
    all = table[a[j]] !== -1;
  }
  return all;
};
const unionUnshift = (a, b, d, m) => {
  const f = d || _d;
  f.length = 0;
  for (let i = 0; i < b.length; i++) {
    f.push(b[i]);
  }
  m.unshift(a[a.length - 1]);
  f.unshift(a[a.length - 1]);
  for (let i = a.length - 2; i > -1; --i) {
    if (table[a[i]] === -1) {
      m.unshift(a[i]);
      f.unshift(a[i]);
    }
  }
  return f;
};
const unionInject = (a, b, d, m, lastMissingIndex) => {
  const f = d || _d;
  f.length = 0;
  for (let i = 0; i < b.length; i++) {
    f.push(b[i]);
  }
  for (let i = a.length - 2; i > -1; --i) {
    if (table[a[i]] === -1) {
      let k;
      for (k = i + 1; table[a[k]] === -1 || table[a[k]] > lastMissingIndex; ++k) {}
      lastMissingIndex = table[a[k]];
      m.unshift(a[i]);
      f.splice(lastMissingIndex, 0, a[i]);
    }
  }
  return f;
};
const inOrderUnion = (a, b, d, m) => {
  if (a.length === 0) {
    return b;
  }

  if (isEqual(a, b)) {
    return a;
  }

  buildTable(a, b);

  if (isAll(a, b)) {
    return b;
  }

  const lastMissingIndex = table[a[a.length - 1]];
  if (lastMissingIndex === -1) {
    return unionUnshift(a, b, d, m);
  }

  return unionInject(a, b, d, m, lastMissingIndex);
};

export default inOrderUnion;
