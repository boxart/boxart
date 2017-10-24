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

const TRANSITIONS = [
  [1, 2, 9, 9, 9],
  [9, 3, 9, 9, 9],
  [3, 9, 0, 9, 9],
  [9, 9, 1, 8, 9],
  [5, 6, 9, 9, 9],
  [9, 7, 9, 9, 9],
  [7, 9, 4, 9, 9],
  [9, 9, 5, 8, 9],
  [7, 9, 5, 9, 6],
];

const START_SOON = [
  [false, false, false, false, false],
  [false, true, false, false, false],
  [true, false, false, false, false],
  [false, false, false, false, false],
  [false, false, false, false, false],
  [false, true, false, false, false],
  [true, false, false, false, false],
  [false, false, false, false, false],
  [true, false, false, false, false],
];

const RESOLVE = [
  [false, false, false, false, false],
  [false, false, false, false, false],
  [false, false, false, false, false],
  [false, false, false, false, false],
  [false, false, false, false, false],
  [true, false, false, false, false],
  [false, false, false, false, false],
  [true, false, false, false, false],
  [true, false, false, false, true],
];

class AnimatedState {
  constructor(animations) {
    this.state = '__init__';
    this.transitionState = EMPTY;
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
    this.update = updateNoop;
    this.animate = animateNoop;
    this.present = presentNoop;
  }

  get() {
    return this.state;
  }

  set(state) {
    this.state = state;
    this.transitionStep(PREPARE);
  }

  setThen(state) {
    return new Promise(function(resolve) {
      this.set(state);
      this.resolve = resolve;
    });
  }

  schedule(animated, loop) {
    this.loop = loop;
    this.data.animated = animated;
    this.transitionStep(SCHEDULE);
  }

  unschedule() {
    this.data.animated = null;
    this.transitionStep(UNSCHEDULE);
  }

  transitionStep(input) {
    const tstate = this.transitionState;
    if (
      (
        tstate === STARTING ||
        tstate === WAIT_FOR_FRAME
      ) &&
      input === START
    ) {
      const state = this.get() || 'default';
      const defaultAnimation = this.animations.default || noopAnimation;
      const animation = this.animations[state] || defaultAnimation;
      const update = this.update =
        animation.update || defaultAnimation.update || updateNoop;
      const animate = this.animate =
        animation.animate || defaultAnimation.animate || animateNoop;
      const present = this.present =
        animation.present || defaultAnimation.present || presentNoop;

      const {data} = this;
      const {element} = data.animated.root;
      data.end = update(data.end, element, data);
      if (tstate === STARTING) {
        data.state = update.copy(data.state, data.end);
        data.begin = update.copy(data.begin, data.end);
      }
      data.store = present.store(data.store, element, data);
      this.loop.add(this);
      this.transitionState = RUNNING;
      return;
    }

    if (RESOLVE[tstate][input]) {
      this.resolve();
    }

    if (tstate === RUNNING && (
      input === PREPARE ||
      input === DONE ||
      input === UNSCHEDULE
    )) {
      this.present.restore(this.data.animated.root.element, this.data.store, this.data);
      this.update.copy(this.data.begin, this.data.state);
      this.loop.remove(this);
    }

    if (START_SOON[tstate][input]) {
      this.loop.soon().then(() => this.transitionStep(START));
    }

    if (TRANSITIONS[tstate][input] !== 9) {
      this.transitionState = TRANSITIONS[tstate][input];
    }
  }

  step(dt) {
    if (this.transitionState !== RUNNING) {return;}
    const {data, animate} = this;
    data.t += dt;
    animate(data.t, data.state, data.begin, data.end);
    if (animate.eq && animate.eq(data.t, data.state, data.begin, data.end)) {
      this.transitionStep(DONE);
    }
    this.present(data.animated.root.element, data.state, data);
  }
}

module.exports = AnimatedState;
