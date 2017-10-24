const BEFORE_ITEMS = 'before_items';
const AFTER_ITEMS = 'after_items';
const ITEMS = 'items';
const ANIMATE = 'animate';
const DESTROY = 'destroy';

const STAGES = [
  BEFORE_ITEMS,
  AFTER_ITEMS,
  ITEMS,
  ANIMATE,
  DESTROY,
];

const MAX_DT = 0.033;

export default class RunLoop {
  constructor(options = {}) {
    this.stages = {
      [BEFORE_ITEMS]: [],
      [AFTER_ITEMS]: [],
      [ITEMS]: [],
      [ANIMATE]: [],
      [DESTROY]: [],
    };
    this.stageOrder = [
      this.stages[BEFORE_ITEMS],
      this.stages[ITEMS],
      this.stages[AFTER_ITEMS],
      this.stages[ANIMATE],
      this.stages[DESTROY],
    ];
    this.cleanup = [];
    this.scheduledCount = 0;

    this.last = 0;
    this.loop = this.loop.bind(this);
    this._soonNull = this._soonNull.bind(this);

    this._requestFrame = options.requestFrame || requestAnimationFrame;
    this._cancelFrame = options.cancelFrame || cancelAnimationFrame;
    this.now = options.now || Date.now;
    this.resume();
  }

  _request() {
    this.last = this.now();
    this.requestFrame();
  }

  _cancel() {
    this.cancelFrame();
  }

  requestFrame() {
    if (this.scheduledCount && this.rafId === null) {
      if (this.sleeping) {
        this.last = this.now();
        this.sleeping = false;
      }
      this.rafId = this._requestFrame.call(null, this.loop);
    }
    else if (this.scheduledCount === 0) {
      this.sleeping = true;
      this.rafId = null;
    }
  }

  cancelFrame() {
    this._cancelFrame.call(null, this.rafId);
    this.sleeping = true;
    this.rafId = null;
  }

  doCleanup() {
    const cleanup = this.cleanup;
    let oldItem, stage, index;
    for (let i = 0, l = cleanup.length; i < l; ++i) {
      oldItem = cleanup[i][0];
      stage = cleanup[i][1];
      index = this.stages[stage].findIndex(item => item === oldItem);
      this.stages[stage].splice(index, 1);
      this.scheduledCount -= 1;
    }
    cleanup.length = 0;
  }

  loop() {
    const now = this.now();
    const dt = Math.min((now - this.last) / 1000, MAX_DT);
    this.last = now;

    this.doCleanup();

    this.rafId = null;
    this.requestFrame();

    for (let stage of this.stageOrder) {
      for (let item of stage) {
        try {
          (item.step || item)(dt);
        }
        catch (error) {
          console.error(error ? (error.stack || error) : error);
        }
      }
    }
  }

  pause() {
    this._cancel();
  }

  resume() {
    this._request();
  }

  add(item) {
    this.stages[ANIMATE].push(item);
    this.scheduledCount += 1;
    this.requestFrame();
  }

  remove(item) {
    this.cleanup.push([item, ANIMATE]);
  }

  once(fn, stage = BEFORE_ITEMS) {
    const _fn = (...args) => {
      this.cleanup.push([_fn, stage]);
      fn(...args);
    };
    this.stages[stage].push(_fn);
    this.scheduledCount += 1;
    this.requestFrame();
  }

  schedule(fn, stage = BEFORE_ITEMS) {
    this.stages[stage].push(fn);
    this.scheduledCount += 1;
    this.requestFrame();
  }

  unschedule(fn, stage) {
    if (!stage) {
      for (let stage of STAGES) {
        this.unschedule(fn, stage);
      }
    }
    else {
      if (this.stages[stage].find(it => it === fn)) {
        this.cleanup.push([fn, stage]);
      }
    }
  }

  _soonNull() {
    this._soon = null;
  }

  soon() {
    if (this._soon) {return this._soon;}
    this._soon = Promise.resolve().then(this._soonNull);
    return this._soon;
  }
}

RunLoop.stages = {
  BEFORE_ITEMS,
  AFTER_ITEMS,
  ITEMS,
  ANIMATE,
  DESTROY,
};

if (typeof requestAnimationFrame === 'function') {
  RunLoop.main = new RunLoop();
}
else {
  RunLoop.main = new RunLoop({
    requestFrame: fn => setTimeout(fn, 16),
    cancelFrame: id => clearTimeout(id),
  });
}
