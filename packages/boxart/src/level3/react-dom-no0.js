import {Component} from 'react';

// level 1
import AnimatedManager from '../level1/animated-manager';
import AnimatedStateFactory from '../level1/animated-state-factory';
import Bus from '../level1/bus';
import BusAnimatedManager from '../level1/bus-animated-manager';
import Matcher from '../level1/matcher';
import RunLoop from '../level1/runloop';

// level 2
import ReactCrawler from '../level2/react-crawler';
import ReactElementTransition from '../level2/react-element-transition';
import ReactNodeIdGenerator from '../level2/react-node-id-generator';
import ReactTransition from '../level2/react-transition';
import TrasitionTree from '../level2/transition-tree';

/**
 * @example
 *   import Boxart from 'boxart-react';
 *
 *   import animations from './animations';
 *
 *   render(<Boxart animations={animations}><Application /></Boxart>, rootElement);
 */

class React extends Component {
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

    const manager = this.manager = new AnimatedManager(factory, loop);

    new BusAnimatedManager(manager, bus);

    this.crawler = new ReactCrawler(bus, matcher);

    const tree = new TrasitionTree(new ReactNodeIdGenerator(matcher));
    new ReactTransition(this.crawler, bus, tree, matcher);
    new ReactElementTransition(bus, tree, matcher);
  }

  render() {
    const {children} = this.props;
    return this.crawler.inject(children, 'root', true);
  }
}

export default React;
