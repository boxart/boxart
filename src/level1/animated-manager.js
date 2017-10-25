import RunLoop from './runloop';

class AnimatedManager {
  constructor(factory, loop = RunLoop.main) {
    this.factory = factory;
    this.loop = loop;

    this.states = {};
  }

  get(type, id) {
    let animatedState = this.states[id];
    if (!animatedState) {
      animatedState = this.states[id] = this.factory(type);
    }

    return animatedState;
  }

  set(type, id, state) {
    const animatedState = this.get(type, id);
    animatedState.set(state || 'default');

    return animatedState;
  }

  delete(type, id) {
    if (this.states[id]) {
      this.states[id].unschedule();
      this.states[id] = null;
    }
  }

  setElement(type, id, element) {
    const animatedState = this.get(type, id);
    if (animatedState) {
      const animated = animatedState.data.animated || {root: {element: null}};
      animated.root.element = element;
      animatedState.schedule(animated, this.loop);
    }
  }
}

export default AnimatedManager;
