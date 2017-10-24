import AnimatedState from './animated-state.new';
// import {ORDER} from './state';

class ScheduleInfo {
  constructor() {
    this.state = null;
    this.loop = null;
    this.element = null;
    this.schedule = _scheduleElement;
  }

  clear() {
    this.state = null;
    this.loop = null;
    this.element = null;
    return this;
  }

  set(state, loop, element) {
    this.state = state;
    this.loop = loop;
    this.element = element;
    return this;
  }
}

const schedulePool = [];

const popSchedule = ScheduleInfo.pop = (state, loop, element) => {
  return (schedulePool.pop() || new ScheduleInfo()).set(state, loop, element);
};

const pushSchedule = ScheduleInfo.push = info => {
  schedulePool.push(info.clear());
};

const _scheduleElement = function(data) {
  const {state} = data;
  state.unschedule();
  if (state.animated && state.animated.root) {
    state.animated.root.element = data.element;
    state.schedule(state.animated, data.loop);
  }
  else {
    state.schedule({root: {element: data.element}}, data.loop);
  }
  pushSchedule(data);
};

const poolEnd = [];

const popEnd = (stateEnd, type, id, state) => {
  const obj = poolEnd.length ? poolEnd.pop() : {};
  obj.stateEnd = stateEnd;
  obj.type = type;
  obj.id = id;
  obj.state = state;
  obj.emit = _emitEnd.bind(null, obj);
  return obj;
};

const pushEnd = (obj) => {
  obj.stateEnd = null;
  // poolEnd.push(obj);
};

const _emitEnd = function(data) {
  data.stateEnd(data.type, data.id, data.state);
  pushEnd(data);
};

class AnimatedManager {
  constructor(animations, bus, loop) {
    this.animations = animations;
    this.bus = bus;
    this.loop = loop || RunLoop.main;
    this.elements = {};
    this.states = {};
    this.pool = [];

    this._pendingElements = [];
    this._scheduleElements = this._scheduleElements.bind(this);

    this.stateBegin = this.bus.bind('state:begin', 3);
    this.stateEnd = this.bus.bind('state:end', 3);

    this.bus.on('state:change', this.set.bind(this));
    this.bus.on('state:destroy', this.delete.bind(this));
    this.bus.on('element:create', this.setElement.bind(this));
    this.bus.on('element:update', this.setElement.bind(this));
    this.bus.on('element:destroy', this.delete.bind(this));
  }

  pop(animations) {
    if (this.pool.length) {
      return this.pool.pop().use(animations);
    }
    return new AnimatedState(animations);
  }

  push(state) {
    // this.pool.push(state.clear());
  }

  set(type, id, state) {
    if (!this.states[id]) {
      this.states[id] = this.pop(this.animations[type]);
    }

    this.states[id].set(
      state || 'default',
      // ORDER.IMMEDIATE,
      null,
      popEnd(this.stateEnd, type, id, state).emit
    );

    this.stateBegin(type, id, state);
  }

  delete(type, id) {
    if (this.states[id]) {
      this.states[id].unschedule();
      const state = this.states[id];
      // setTimeout(() => this.push(state), 100);
      this.elements[id] = null;
      this.states[id] = null;
    }
  }

  setElement(type, id, element) {
    if (element === this.elements[id]) {return;}
    if (this.elements[id]) {
      // this.elements[id].style.visibility = 'hidden';
      // element.style.visibility = '';
    }
    this.elements[id] = element;

    if (this.states[id]) {
      if (this._pendingElements.length) {
        this._pendingElements
        .push(popSchedule(this.states[id], this.loop, element));
      }
      else {
        this.loop.soon().then(this._scheduleElements);
        this._pendingElements
        .push(popSchedule(this.states[id], this.loop, element));
      }
    }
  }

  _scheduleElements() {
    for (let i = 0; i < this._pendingElements.length; ++i) {
      this._pendingElements[i].schedule(this._pendingElements[i]);
    }
    this._pendingElements.length = 0;
  }
}

export default AnimatedManager
