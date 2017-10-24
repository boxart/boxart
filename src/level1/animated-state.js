import RunLoop from './runloop';
import State from './state';

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
const falseFn = () => {return false;};
const trueFn = () => {return true;}

const TransitionState_NeedBeginning = 0;
const TransitionState_Beginning = 1;
const TransitionState_Pending = 2;
const TransitionState_NotRunning = 3;
const TransitionState_NotAnimated = 4;
const TransitionState_Running = 5;

const TransitionState = {
  NeedBeginning: TransitionState_NeedBeginning,
  Beginning: TransitionState_Beginning,
  Pending: TransitionState_Pending,
  NotRunning: TransitionState_NotRunning,
  NotAnimated: TransitionState_NotAnimated,
  Running: TransitionState_Running,
};

const TransitionInput_Unschedule = -1;
const TransitionInput_Schedule = 0;
const TransitionInput_Start = 1;
const TransitionInput_Cancel = 3;
const TransitionInput_Done = 4;

const TransitionInput = {
  Unschedule: TransitionInput_Unschedule,
  Schedule: TransitionInput_Schedule,
  Start: TransitionInput_Start,
  Cancel: TransitionInput_Cancel,
  Done: TransitionInput_Done,
};

class SetObj {
  constructor() {
    this.state = '';
    this.order = '';
    this.data = null;
    this.transition = noop;
    this.cancel = noop;
  }

  set(state, order, data, transition, cancel) {
    this.state = state;
    this.order = order;
    this.data = data;
    this.transition = transition;
    this.cancel = cancel;

    return this;
  }
}

const _setObj = new SetObj();

const setObj = _setObj.set.bind(_setObj);

class AnimatedState {
  constructor(animations) {
    this.state = new State();

    this._resolve = noop;

    this.clear().use(animations);

    this.transition = this.transition.bind(this);
    this._transitionSetResolve = this._transitionSetResolve.bind(this);
    this.transitionStepSchedule = this.transitionStep.bind(this, TransitionInput_Schedule);

    this.cancel = this.cancel.bind(this);

    this.step = this.step.bind(this);
  }

  clear() {
    this.state.clear();

    this.animation = {};
    this.animations = null;
    this.animated = null;
    this.loop = null;

    this.stored = false;
    this.running = null;
    this.insideLoop = false;

    this.transitionCallback = noop;
    this.transitionState = TransitionState_NeedBeginning;

    this.data = {
      t: 0,
      animated: null,
      store: {},
      state: {},
      begin: {},
      end: {},
    };

    return this;
  }

  use(animations) {
    this.state.use();

    this.animations = animations;

    return this;
  }

  set(state, order, _cb) {
    this.state.set(setObj(
      state,
      order,
      _cb || noop,
      this.transition,
      this.cancel
    ));

    return this;
  }

  transition(callback) {
    this.running = new Promise(this._transitionSetResolve);
    this.transitionCallback = callback;
    this.transitionStep(TransitionInput_Start);

    return this.running;
  }

  cancel() {
    try {
      this.transitionStep(TransitionInput_Cancel);
    }
    catch (e) {
      console.error(e);
    }
  }

  _transitionSetResolve(resolve) {
    this._resolve = resolve;
  }

  transitionStep(transitionInput) {
    switch (this.transitionState) {
    case TransitionState_NeedBeginning:
      switch (transitionInput) {
      case TransitionInput_Start:
        this.transitionState = TransitionState_Beginning;
        if (this.loop) {
          this.transitionStep(TransitionInput_Schedule)
        }
        break;
      }
      break;

    case TransitionState_Beginning:
      switch (transitionInput) {
      case TransitionInput_Schedule:
        if (this.animated && this.loop) {
          this.transitionState = TransitionState_NotRunning;
          this.updateStart();
          this.transitionStep(TransitionInput_Schedule);
        }
        break;

      case TransitionInput_Cancel:
        this.transitionState = TransitionState_NeedBeginning;
        this._callCb();
        break;
      }
      break;

    case TransitionState_Pending:
      switch (transitionInput) {
      case TransitionInput_Start:
        this.transitionState = TransitionState_NotRunning;
        if (this.loop) {
          this.loop.soon().then(this.transitionStepSchedule);
        }
        break;
      }
      break;

    case TransitionState_NotRunning:
      switch (transitionInput) {
      case TransitionInput_Schedule:
        if (this.animated && this.loop) {
          if (this.transitionStart()) {
            this.transitionState = TransitionState_Running;
          }
          else {
            this.transitionState = TransitionState_Pending;
            this._callCb();
          }
        }
        break;

      case TransitionInput_Cancel:
        this.transitionState = TransitionState_Pending;
        this._callCb();
        break;
      }
      break;

    case TransitionState_NotAnimated:
      switch (transitionInput) {
      case TransitionInput_Schedule:
        if (this.animated && this.loop) {
          this.transitionState = TransitionState_Running;
          this._schedule();
        }
        break;

      case TransitionInput_Cancel:
        this.transitionState = TransitionState_Pending;
        this.transitionEnd();
        this._callCb();
        break;
      }
      break;

    case TransitionState_Running:
      switch (transitionInput) {
      case TransitionInput_Unschedule:
        this.transitionState = TransitionState_NotAnimated;
        this._unschedule();
        break;

      case TransitionInput_Cancel:
      case TransitionInput_Done:
        this.transitionState = TransitionState_Pending;
        this.transitionEnd();
        this._callCb();
        break;
      }
      break;
    }
  }

  updateStart() {
    this.setHandlers();

    const {data} = this;
    const {root} = this.animated;
    const {update} = this.animation;

    update(root.element, data.state, data);
    data.begin = update.copy(data.begin, data.state);
  }

  _callCb() {
    if (this.running) {
      this.running = null;
      this.transitionCallback();
      this._resolve();
    }
  }

  transitionStart() {
    this.data.begin.tsub = 0;
    this.data.t = 0;
    this.setHandlers();

    const {data} = this;
    const {root} = this.animated;
    const {update, present} = this.animation;

    update(root.element, data.end, data);
    if (update.should && !update.should(data.begin, data.end)) {
      return false;
    }

    this.loopAdd();
    if (!this.stored) {
      this.stored = true;
      present.store(data.store, root.element, data);
    }
    return true;
  }

  transitionEnd() {
    this.loopRemove();
    this.restore();
  }

  store() {
    const {data} = this;
    const {root} = this.animated;
    const {update, present} = this.animation;

    if (this.running && this.animated && !this.stored) {
      this.stored = true;
      present.store(data.store, root.element, data);
      update(root.element, data.end, data);
    }
  }

  restore() {
    if (this.animated && this.stored) {
      const {data} = this;
      const {root} = this.animated;
      const {update, present} = this.animation;

      this.stored = false;
      present.restore(root.element, data.store, data);
      data.begin = update.copy(data.begin, data.state);
    }
  }

  setHandlers() {
    const state = this.state.get() || 'default';
    const defaultAnimation = this.animations.default || noopAnimation;
    const animation = this.animations[state] || defaultAnimation;
    this.animation.update = animation.update || defaultAnimation.update || updateNoop;
    this.animation.animate = animation.animate || defaultAnimation.animate || animateNoop;
    this.animation.present = animation.present || defaultAnimation.present || presentNoop;
  }

  restart() {
    this.data.begin.tsub += this.data.t;
    this.data.t = 0;
  }

  loopAdd() {
    if (this.running && this.animated && !this.insideLoop) {
      this.insideLoop = true;
      this.loop.add(this);
    }
  }

  loopRemove() {
    if (this.insideLoop) {
      this.insideLoop = false;
      this.loop.remove(this);
    }
  }

  step(dt) {
    if (!this.animated) {return;}
    if (!this.stored) {
      return this.loop.soon()
      .then(() => this.store())
      .then(() => this.step(dt));
    }
    const {data} = this;
    const {animate} = this.animation;
    data.t += dt;
    animate(data.t, data.state, data.begin, data.end);
    if (
      animate.eq && animate.eq(data.t, data.state, data.begin, data.end)
    ) {
      this.transitionStep(TransitionInput_Done);
    }
    this.animation.present(this.animated.root.element, data.state, data);
  }

  schedule(animated, loop) {
    this.animated = animated;
    this.data.animated = animated;
    if (!this.loop) {
      (loop || RunLoop.main).soon().then(this.transitionStepSchedule);
    }
    else {
      (loop || this.loop).soon().then(this.transitionStepSchedule);
    }
    this.loop = (loop || this.loop || RunLoop.main);
    return this;
  }

  _schedule() {
    if (this.animated) {
      this.loopAdd();
      this.store();
    }
  }

  unschedule() {
    this.restore();
    this.animated = null;
    this.data.animated = null;
    if (this.loop) {
      this.loop.soon()
      .then(() => this.transitionStep(TransitionInput_Unschedule));
    }
    return this;
  }

  _unschedule() {
    if (!this.animated) {
      this.loopRemove();
    }
  }

  destroy() {
    this.unschedule();
  }
}

export default AnimatedState;
