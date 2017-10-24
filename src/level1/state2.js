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
  if (!info.frozen) {
    infoPool.push(info.clear());
  }
};

const infoNoop = StateInfo.pop('__empty__', null, noop, noop);
infoNoop.frozen = true;
const infoInit = StateInfo.pop('__init__', null, noop, noop);
infoInit.frozen = true;

const next = instance => {
  instance.substate = SUBSTATE__READY;
  const item = instance._nextItem;
  instance._nextItem = null;
  if (item) {
    start(instance, item);
  }
  else {
    instance._item = infoNoop;
  }
};

const start = (instance, info) => {
  instance._item = info;
  info.cancel = info.cancel || noop;
  instance.substate = SUBSTATE__TRANSITION;
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
    this._next = () => next(this);
    this._item = infoNoop;
    this._nextItem = null;

    this.clear();
    this.use(initialState);
  }

  clear() {
    this._item = infoInit;
    this._nextItem = null;
    this.substate = SUBSTATE__READY;
  }

  use(initialState = '__init__') {
    if (initialState !== '__init__') {
      this._item.state = StateInfo.pop(initialState, null, noop, noop);
    }
    else {
      this._item.state = initialState;
    }
  }

  get() {
    return this._item.state;
  }

  set(info) {
    switch (info.order || ORDER__IMMEDIATE) {
    case ORDER__IMMEDIATE:
      this._item._cancel();

      if (this.substate === SUBSTATE__READY) {
        // inline start(...)
        this._item = info;
        this.substate = SUBSTATE__TRANSITION;
        info.cancel = info.cancel || noop;
        const result = (info.transition || noop)(info.data);
        if (result && result.then) {
          result.then(this._next);
        }
        else {
          this._next();
        }
      }
      else {
        this._item = infoNoop;
        this._nextItem = StateInfo.pop(info.state, info.data, info.transition, info.cancel);
      }
      break;

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
