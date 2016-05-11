export default class AnimatedTimer {
  constructor(agent) {
    this._agent = agent;
    this.run = 1;
    this._oncancel = null;
    this._fulfilled = false;
    this.promise = null;
    this._joinIndex = 0;
    this._joins = [];
  }

  _init(fn = function() {}) {
    this._oncancel = null;
    this._fulfilled = false;
    this._joins = [];
    const run = this.run;
    this.promise = new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
      this._join(fn.call(this, this));
    })
    .then(() => {
      if (this.run === run) {
        this.run++;
        this._fulfilled = true;
      }
    });
    return this;
  }

  _join(promise) {
    if (this._fulfilled) {
      throw new Error('Timer fulfilled');
    }
    const run = this.run;
    const _joinIndex = ++this._joinIndex;
    this._joins.push(_joinIndex);
    return Promise.resolve(promise)
    .then(() => {
      // This will add this chain to the end of resolving promises. We don't
      // return this promise as it would delay any step after this parent then
      // clause until after we have resolved the timer. Instead create this out
      // of chain secondary promise chain that will wait until any possible then
      // clause to have started another step in the timer that will also be
      // joined.
      Promise.resolve()
      .then(() => Promise.resolve())
      .then(() => {
        const index = this._joins.indexOf(_joinIndex);
        if (index !== -1) {
          this._joins.splice(index, 1);
          if (this._joins.length === 0) {
            this._resolve();
          }
        }
      });
      if (this._fulfilled) {
        throw new Error('Timer fulfilled');
      }
      if (this.run !== run) {
        throw new Error('Timer canceled');
      }
    });
  }

  cancelable(fn) {
    this._oncancel = fn;
  }

  cancel() {
    this.run++;
    let cancelResult;
    if (this._oncancel) {
      cancelResult = this._oncancel();
    }
    this._reject(new Error('Timer canceled'));
    return cancelResult;
  }

  join(promise) {
    return this._join(promise);
  }

  frame() {
    return this._join(this._agent.frame());
  }

  timeout(delay) {
    return this._join(new Promise(resolve => setTimeout(resolve, delay)));
  }

  loop(fn) {
    const run = this.run;
    return this._join(new Promise((resolve, reject) => {
      const loop = () => {
        if (this.run !== run) {
          reject(new Error('Timer canceled'));
        }
        else if (fn() >= 1) {
          resolve();
        }
        else {
          this._agent.frame().then(loop);
        }
      };
      loop();
    }));
  }

  then(cb, eb) {
    return this.promise.then(cb, eb);
  }
}
