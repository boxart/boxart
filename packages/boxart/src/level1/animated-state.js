const updateNoop = (element, state) => state;
updateNoop.copy = dest => dest;
const animateNoop = () => {};
animateNoop.eq = () => true;
const presentNoop = () => {};
presentNoop.store = () => {};
presentNoop.restore = () => {};

const noopAnimation = {
  update: updateNoop,
  animate: animateNoop,
  present: presentNoop,
};

const noop = () => {};

const TSTATES = 9;

const EMPTY = 0;
const INITIALIZED = 1;
const BOUND = 2;
const STARTING = 3;
const PREPPED = 4;
const PENDING = 5;
const READY = 6;
const WAIT_FOR_FRAME = 7;
const RUNNING = 8;

const TINPUTS = 5;

const PREPARE = 0;
const SCHEDULE = 1;
const UNSCHEDULE = 2;
const START = 3;
const DONE = 4;

const NONE = 0;
const RESOLVE = 1;
const START_SOON = 2;

const __INIT__ = '__init__';

const startSoon = function(_this) {
  _this.loop.soon().then(() => transitionStep(_this, START));
};

const step0Soon = function(_this) {
  _this.loop.soon().then(() => step(_this, 0));
};

const transitionStep = function(_this, input) {
  let transitionState = _this.transitionState;
  let action = NONE;

  if (transitionState === STARTING || transitionState === WAIT_FOR_FRAME) {
    if (input === START) {
      if (transitionState === STARTING) {
        _this.animation = {};
      }

      const state = _this.get() || 'default';
      const defaultAnimation = _this.animations.default || noopAnimation;
      const animation = _this.animations[state] || defaultAnimation;
      const update = _this.animation.update = animation.update ||
        defaultAnimation.update || updateNoop;
      _this.animation.animate = animation.animate ||
        defaultAnimation.animate || animateNoop;
      const present = _this.animation.present = animation.present ||
        defaultAnimation.present || presentNoop;

      const {data} = _this;
      const {root} = data.animated;
      data.lastT = data.t;
      data.t = 0;
      data.end = update(root.element, data.end, data);
      console.log(JSON.stringify(data.end, null, '  '));
      if (_this.transitionState === STARTING) {
        data.state = update.copy(data.state, data.end);
        data.begin = update.copy(data.begin, data.end);
      }
      data.store = present.store(data.store, root.element, data);
      _this.loop.add(step, _this);
      _this.transitionState = RUNNING;

      step0Soon(_this);
      return;
    }
  }

  if (transitionState === EMPTY) {
    if (input === PREPARE) {
      transitionState = INITIALIZED;
    }
    else if (input === SCHEDULE) {
      transitionState = BOUND;
    }
  }
  else if (transitionState === INITIALIZED) {
    if (input === SCHEDULE) {
      action = START_SOON;
      transitionState = STARTING;
    }
  }
  else if (transitionState === BOUND) {
    if (input === PREPARE) {
      action = START_SOON;
      transitionState = STARTING;
    }
    else if (input === UNSCHEDULE) {
      transitionState = EMPTY;
    }
  }
  else if (transitionState === PREPPED) {
    if (input === PREPARE) {
      transitionState = PENDING;
    }
    else if (input === SCHEDULE) {
      transitionState = READY;
    }
  }
  else if (transitionState === PENDING) {
    if (input === PREPARE) {
      action = RESOLVE;
    }
    else if (input === SCHEDULE) {
      action = START_SOON;
      transitionState = WAIT_FOR_FRAME;
    }
  }
  else if (transitionState === READY) {
    if (input === PREPARE) {
      action = START_SOON;
      transitionState = WAIT_FOR_FRAME;
    }
    else if (input === UNSCHEDULE) {
      transitionState = PREPPED;
    }
  }
  else if (transitionState === WAIT_FOR_FRAME) {
    if (input === PREPARE) {
      action = RESOLVE;
    }
    else if (input === UNSCHEDULE) {
      transitionState = PENDING;
    }
  }
  else if (transitionState === RUNNING) {
    if (input === PREPARE || input === DONE || input === UNSCHEDULE) {
      if (input !== UNSCHEDULE) {
        _this.resolve();
      }

      const {data} = _this;
      _this.animation.present.restore(data.animated.root.element, data.store, data);
      _this.animation.update.copy(data.begin, data.state);
      _this.loop.remove(step, _this);
    }

    if (input === PREPARE) {
      action = START_SOON;
      transitionState = WAIT_FOR_FRAME;
    }
    else if (input === UNSCHEDULE) {
      transitionState = PENDING;
    }
    else if (input === DONE) {
      transitionState = READY;
    }
  }

  if (action !== NONE) {
    if (action === RESOLVE) {
      _this.resolve();
    }
    else if (action === START_SOON) {
      startSoon(_this);
    }
  }
  if (transitionState !== _this.transitionState) {
    _this.transitionState = transitionState;
  }
};

const step = function(_this, dt) {
  if (_this.transitionState !== RUNNING) {return;}
  const {data} = _this;
  const {animate, present} = _this.animation;
  data.t += dt;
  animate(data.t, data.state, data.begin, data.end);
  if (animate.done && animate.done(data.t, data.state, data.begin, data.end)) {
    transitionStep(_this, DONE);
  }
  else {
    present(data.animated.root.element, data.state, data);
  }
};

class AnimatedState {
  constructor(animations) {
    this.state = __INIT__;
    this.transitionState = EMPTY;
    this.animation = null;
    this.animations = animations;
    this.data = {
      t: 0,
      lastT: 0,
      store: null,
      state: null,
      begin: null,
      end: null,
      animated: null,
    };

    this.resolve = noop;
  }

  get() {
    return this.state;
  }

  set(state, order, resolve = noop) {
    console.log('set', arguments);
    this.state = state;
    transitionStep(this, PREPARE);
    // Set resolve after stepping the transitionState. Stepping may call the
    // last set resolve method to signal to another object that its state
    // transition completed in some fashion.
    this.resolve = resolve;
  }

  setThen(state) {
    return new Promise(resolve => this.set(state, null, resolve));
  }

  schedule(animated, loop) {
    this.data.animated = animated;
    this.loop = loop;
    transitionStep(this, SCHEDULE);
  }

  unschedule() {
    transitionStep(this, UNSCHEDULE);
    this.data.animated = null;
  }

  transitionStep(input) {
    transitionStep(this, input);
  }

  step(dt) {
    step(this, dt);
  }
}

export default AnimatedState;
