// level 1
import AnimatedManager from '../level1/animated-manager';
import AnimatedStateFactory from '../level1/animated-state-factory';
import Bus from '../level1/bus';
import BusAnimatedManager from '../level1/bus-animated-manager';
import Matcher from '../level1/matcher';
import RunLoop from '../level1/runloop';

// level 2
import InnerMutationObserver from '../level2/mutation-observer';

/**
 * @example
 *   import BoxartMutationObserver from 'boxart-mutation-observer';
 *
 *   import animations from './animations';
 *
 *   new BoxartMutationObserver({animations})
 *   .observe(rootElment);
 */

class BoxartMutationObserver {
  constructor({loop, animations}) {
    this.loop = loop || RunLoop.main;
    this.animations = animations;

    const bus = this.bus = new Bus();

    const animationTypes = {};
    const matcher = this.matcher = new Matcher();
    Object.keys(animations).forEach(key => {
      matcher.add(key, Object.keys(animations[key]));
      animationTypes[key.split(' ')[0]] = animations[key];
    });

    const {create: factory} = new AnimatedStateFactory(animations);

    const manager = this.manager = new AnimatedManager(factory, this.loop);

    new BusAnimatedManager(manager, bus);

    this.innerObserver = new InnerMutationObserver({bus, matcher});
  }

  observe(target) {
    this.innerObserver.observe(target);
  }

  disconnect() {
    this.innerObserver.disconnect();
  }

  getManager() {
    return this.manager;
  }

  getAnimated(element) {
    return this.manager.getAnimated(element);
  }
}

export default BoxartMutationObserver;
