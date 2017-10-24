import {Component} from 'preact';

// level 0
import animate from '../level0/animate';
import present from '../level0/present';
import update from '../level0/update';

// level 1
import AnimatedManager from '../level1/animated-manager.new';
import AnimatedStateFactory from '../level1/animated-state-factory';
import Bus from '../level1/bus';
import BusAnimatedManager from '../level1/bus-animated-manager';
import Matcher from '../level1/matcher';
import RunLoop from '../level1/runloop.new';

// level 2
import PreactComponentTransition from '../level2/preact-component-transition';
import PreactCrawler from '../level2/preact-crawler';
import PreactElementTransition from '../level2/preact-element-transition';
import PreactNodeIdGenerator from '../level2/preact-node-id-generator';
import PreactTransition from '../level2/preact-transition';
import TrasitionTree from '../level2/transition-tree';

/**
 * @example
 *   import Boxart from 'boxart-preact';
 *
 *   import animations from './animations';
 *
 *   render(<Boxart animations={animations}><Application /></Boxart>, rootElement);
 */

class Preact extends Component {
  constructor(...args) {
    super(...args);

    const {loop, animations} = this.props;

    const bus = new Bus();

    const animationTypes = {};
    const matcher = new Matcher();
    Object.keys(animations).forEach(key => {
      matcher.add(key, Object.keys(animations[key]));
      animationTypes[key.split(' ')[0]] = animations[key];
    });

    const {create: factory} = new AnimatedStateFactory(animations);

    const manager = new AnimatedManager(factory, loop || RunLoop.main);

    new BusAnimatedManager(manager, bus);

    this.crawler = new PreactCrawler(bus, matcher);

    const tree = new TrasitionTree(new PreactNodeIdGenerator(matcher));
    new PreactTransition(this.crawler, bus, tree, matcher);
    new PreactComponentTransition(bus, tree, matcher);
    new PreactElementTransition(bus, tree, matcher);
  }

  render({children}) {
    return this.crawler.inject(children[0], 'root', true);
  }
}

export default Preact;

export {
  animate,
  present,
  update,

  RunLoop,
};
