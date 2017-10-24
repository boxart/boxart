class BusSet {
  constructor() {
    this.set = [];
  }

  values() {
    return this.set;
  }

  add(value) {
    this.set.push(value);
  }

  delete(value) {
    const index = this.set.indexOf(value);
    if (index !== -1) {
      this.set.splice(index, 1);
    }
  }
}

class Bus {
  constructor() {
    this.bound = {};
    this.sets = {};
  }

  setFor(a, b) {
    this.sets[a] = this.sets[a] || {};
    if (b === '*') {
      return this.sets[a].__all__ = this.sets[a].__all__ || new BusSet();
    }
    else {
      return this.sets[a][b] = this.sets[a][b] || new BusSet();
    }
  }

  bind(s, n) {
    if (!this.bound[s]) {
      let [a, b] = s.split(':');
      const all = this.setFor(a, '*');
      const set = this.setFor(a, b);

      if (n === 3) {
        const _all = all.values();
        const _set = set.values();
        this.bound[s] = (x, y, z) => {
          for (let i = 0, l = _all.length; i < l;) {
            _all[i++](b, x, y, z);
          }
          for (let i = 0, l = _set.length; i < l;) {
            _set[i++](x, y, z);
          }
        };
      }
      else {
        this.bound[s] = (...args) => {
          for (const item of all.values()) {
            item(b, ...args);
          }
          for (const item of set.values()) {
            item(...args);
          }
        };
      }
    }

    return this.bound[s];
  }

  on(s, fn) {
    let [a, b] = s.split(':');
    const set = this.setFor(a, b);

    set.add(fn);
    return () => set.delete(fn);
  }
}

export default Bus;
