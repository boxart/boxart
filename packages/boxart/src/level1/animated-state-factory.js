import AnimatedState from './animated-state';

class AnimatedStateFactory {
  constructor(animations) {
    this.animations = animations;
    this.create = this.create.bind(this);
  }

  create(type) {
    return new AnimatedState(this.animations[type]);
  }
}

export default AnimatedStateFactory;
