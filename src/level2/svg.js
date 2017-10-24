// level 1
import AnimatedState from '../level1/animated-state.new';
import RunLoop from '../level1/runloop.new';

class AnimatedSvg {
  constructor(options) {
    this.loop = options.loop || RunLoop.main;
    this.animations = options.animations;

    const {element, initialState} = options;
    this.state = new AnimatedState(this.animations);
    if (element) {
      this.state.schedule({root: {element}}, this.loop);
    }
    if (initialState) {
      this.set(initialState);
    }
  }

  set(state) {
    this.state.set(state);
  }

  unschedule() {
    this.state.unschedule();
  }
}

export default AnimatedSvg;
