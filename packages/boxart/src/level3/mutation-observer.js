// level 0
import animate from '../level0/animate';
import present from '../level0/present';
import update from '../level0/update';

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
  constructor({loop = RunLoop.main, animations}) {
    this.animations = animations;

    const bus = this.bus = new Bus();

    const animationTypes = {};
    const matcher = this.matcher = new Matcher();
    Object.keys(animations).forEach(key => {
      matcher.add(key, Object.keys(animations[key]));
      const type = animationTypes[key.split(' ')[0]] = animations[key];
      Object.keys(type).forEach(name => {
        const anim = type[name];
        if (anim.update && !anim.update.copy) {
          try {
          const update = update.context(anim.update);
          if (typeof update === 'function') {
            anim.update = update;
          }
          } catch (e) {
            console.error(e);
          }
        }
        if (anim.update && anim.update.compile) {
          try {
          anim.update = anim.update.compile();
          } catch (e) {
            console.error(e);
          }
        }
        if (anim.animate && !anim.animate.done) {
          try {
          const animate = animate.context(anim.animate);
          if (typeof animate === 'function') {
            anim.animate = animate;
          }
          } catch (e) {
            console.error(e);
          }
        }
        if (anim.animate && anim.animate.compile) {
          try {
          anim.animate = anim.animate.compile();
          } catch (e) {
            console.error(e);
          }
        }
        if (anim.present && !anim.present.store) {
          try {
          const present = present.context(anim.present);
          if (typeof present === 'function') {
            anim.present = present;
          }
          } catch (e) {
            console.error(e);
          }
        }
        if (anim.present && anim.present.compile) {
          try {
          anim.present = anim.present.compile();
          } catch (e) {
            console.error(e);
          }
        }
      });
    });

    const {create: factory} = new AnimatedStateFactory(animations);

    const manager = this.manager = new AnimatedManager(factory, loop);

    new BusAnimatedManager(manager, bus);

    this.innerObserver = new InnerMutationObserver({bus, loop, matcher});
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

export {
  animate,
  present,
  update,
};
