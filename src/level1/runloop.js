const EMPTY = 0;
const HOLDING = 1;
const BOUND = 2;
const RUNNING = 3;

const PAUSE = 0;
const RESUME = 1;
const ADD = 2;
const REMOVE = 3;

const BEFORE_ITEMS = 'BEFORE_ITEMS';
const AFTER_ITEMS = 'AFTER_ITEMS';
const ITEMS = 'ITEMS';
const ANIMATE = 'ANIMATE';
const DESTROY = 'DESTROY';

const ORDER = {
  [BEFORE_ITEMS]: 0,
  [AFTER_ITEMS]: 1,
  [ITEMS]: 2,
  [ANIMATE]: 3,
  [DESTROY]: 4,
};

const MAX_DT = 0.033;

const control = function(_this, input) {
  const oldState = _this._state;
  let state = _this._state;

  if (
    state === EMPTY && input === RESUME ||
    state === RUNNING && input === REMOVE
  ) {
    state = BOUND;
  }
  else if (
    state === EMPTY && input === ADD ||
    state === RUNNING && input === PAUSE
  ) {
    state = HOLDING;
  }
  else if (
    state === HOLDING && input === RESUME ||
    state === BOUND && input === ADD
  ) {
    state = RUNNING;
  }
  else if (
    state === HOLDING && input === REMOVE ||
    state === BOUND && input === PAUSE
  ) {
    state = EMPTY;
  }

  if (state !== oldState) {
    _this._state = state;

    if (oldState === RUNNING) {
      _this.cancelFrame();
    }
    else if (state === RUNNING) {
      _this.last = _this.now();
      _this._frameId = _this.requestFrame();
    }
  }
};

const _remove = function(args) {
  const [fn, data, stage] = args;
  this.remove(fn, data);
  this.remove(this._remove, args, stage);
};

const _soonNull = function() {
  this._soon = null;
};

const loop = function(_this) {
  _this.requestFrame();

  const {cleanup} = _this;
  let oldItem, oldData, index;
  for (let i = 0, l = cleanup.length; i < l; i += 2) {
    oldItem = cleanup[i + 0];
    oldData = cleanup[i + 1];
    for (let stage of _this.stages) {
      index = stage.findIndex((item, i) => (
        i % 2 === 0 &&
        item === oldItem && stage[i + 1] === oldData
      ));
      if (index !== -1) {
        stage.splice(index, 2);
        _this.itemCount -= 1;
        break;
      }
    }
  }
  cleanup.length = 0;

  if (_this.itemCount === 0) {
    control(_this, REMOVE);
    return;
  }

  const now = _this.now();
  const dt = Math.min((now - _this.last) / 1000, MAX_DT);
  _this.last = now;

  for (let stage of _this.stages) {
    for (let i = 0; i < stage.length; i += 2) {
      try {
        stage[i + 0](stage[i + 1], dt);
      }
      catch (error) {
        console.error(error ? (error.stack || error) : error);
      }
    }
  }
}

class RunLoop {
  constructor({
    requestFrame = window.requestAnimationFrame,
    cancelFrame = window.cancelAnimationFrame,
    now = Date.now,
  } = {}) {
    this._state = BOUND;
    this.itemCount = 0;

    this.stages = [[], [], [], [], []];
    this.cleanup = [];

    this._remove = _remove.bind(this);
    this._soonNull = _soonNull.bind(this);

    this.requestFrame = () => {
      this._frameId = requestFrame.call(null, () => loop(this));
    };
    this.cancelFrame = () => {
      cancelFrame.call(null, this._frameId);
    };
    this.now = now;
  }

  pause() {
    control(this, PAUSE);
  }

  resume() {
    control(this, RESUME);
  }

  add(fn, data = null, stage = ANIMATE) {
    if (this.itemCount === 0) {
      control(this, ADD);
    }

    this.itemCount += 1;
    this.stages[ORDER[stage]].push(fn, data);
  }

  remove(fn, data = null) {
    this.cleanup.push(fn, data);
  }

  schedule(fn, data = null, stage = BEFORE_ITEMS) {
    this.add(fn, data, stage);
  }

  unschedule(fn, data = null) {
    this.remove(fn, data);
  }

  once(fn, data = null, stage = BEFORE_ITEMS) {
    this.add(fn, data, stage);
    this.add(this._remove, [fn, data, stage], stage);
  }

  soon() {
    if (!this._soon) {
      this._soon = Promise.resolve().then(this._soonNull);
    }
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

export default RunLoop;
