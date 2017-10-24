const ORDER__ONLY_READY = 'only-ready';
const ORDER__IMMEDIATE = 'immediate';
const ORDER__NEXT = 'next';
const ORDER__QUEUE = 'queue';

export const ORDER = {
  // Immediately start this new transition only if no transition is happening or
  // queued.
  ONLY_READY: ORDER__ONLY_READY,
  // Cancel the current state transition and immediately start the new one
  IMMEDIATE: ORDER__IMMEDIATE,
  // Remove any state in the queue and place this one at the beginning
  NEXT: ORDER__NEXT,
  // Place this state at the end of the queue
  QUEUE: ORDER__QUEUE,
};

const SUBSTATE__READY = 'ready';
const SUBSTATE__TRANSITION = 'transition';

const SUBSTATE = {
  // Ready for a new state
  READY: SUBSTATE__READY,
  // Transition through a state
  TRANSITION: SUBSTATE__TRANSITION,
};

const noop = () => {};


class StateInfo {
  constructor() {
    this.state = '';
    this.data = null;
    this.transition = noop;
    this.cancel = noop;
  }

  clear() {
    this.data = null;
    this.transition = noop;
    this.cancel = noop;
    return this;
  }

  set(state, data, transition, cancel) {
    this.state = state;
    this.data = data;
    this.transition = transition || noop;
    this.cancel = cancel || noop;
    return this;
  }
}

const infoPool = [];

StateInfo.pop = (state, data, transition, cancel) => {
  return (infoPool.pop() || new StateInfo()).set(state, data, transition, cancel);
};

StateInfo.push = info => {
  infoPool.push(info.clear());
};

const next = instance => {
  instance.substate = SUBSTATE__READY;
  const item = instance.queue.shift();
  if (item) {
    start(instance, item);
  }
  else {
    instance._cancel = noop;
  }
};

const start = (instance, info) => {
  instance.state = info.state;
  instance.substate = SUBSTATE__TRANSITION;
  instance._cancel = info.cancel;
  const result = info.transition(info.data);
  if (result && result.then) {
    result.then(instance._next);
  }
  else {
    instance._next();
  }
};

class State {
  constructor(initialState) {
    this.queue = [];
    this._next = () => next(this);

    this.clear();
    this.use(initialState);
  }

  clear() {
    this.state = '__init__';
    this.substate = SUBSTATE__READY;
    this.queue.length = 0;
    this._cancel = noop;
  }

  use(initialState = '__init__') {
    this.state = initialState;
  }

  get() {
    return this.state;
  }

  set(info) {
    switch (info.order || ORDER__NEXT) {
    case ORDER__IMMEDIATE:
      this._cancel();

      if (this.queue.length) {
        for (let i = 0, l = this.queue.length; i < l; ++i) {
          this.queue[i].cancel();
        }
        this.queue.length = 0;
      }

      if (this.substate === SUBSTATE__READY) {
        // inline start(...)
        this.state = info.state;
        this.substate = SUBSTATE__TRANSITION;
        this._cancel = info.cancel || noop;
        const result = (info.transition || noop)(info.data);
        if (result && result.then) {
          result.then(this._next);
        }
        else {
          this._next();
        }
      }
      else {
        this._cancel = noop;
        this.queue.push(StateInfo.pop(info.state, info.data, info.transition, info.cancel));
      }
      break;

    case ORDER__NEXT:
      if (this.substate === SUBSTATE__TRANSITION) {
        for (const item of this.queue) {
          item.cancel();
        }
        this.queue.length = 0;
        this.queue.push(StateInfo.pop(info.state, info.data, info.transition, info.cancel));
        break;
      }
    case ORDER__QUEUE:
      if (this.substate === SUBSTATE__TRANSITION) {
        this.queue.push(StateInfo.pop(info.state, info.data, info.transition, info.cancel));
        break;
      }
    case ORDER__ONLY_READY:
      if (this.substate === SUBSTATE__READY) {
        start(this, StateInfo.pop(info.state, info.data, info.transition, info.cancel));
      }
      break;
    }
  }

  setThen({state, order, transition, cancel} = {}) {
    return new Promise((resolve, reject) => {
      this.set({
        state,
        order,
        transition: transition ?
          () => Promise.resolve(transition()).then(resolve, reject) :
          resolve,
        cancel: cancel ?
          () => {cancel(); resolve();} :
          resolve
      });
    });
  }
}

export default State;
