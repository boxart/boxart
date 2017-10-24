import {Component} from 'preact';

// level 0
import animate from '../level0/animate';
import present from '../level0/present';
import update from '../level0/update';

// level 1
import AnimatedManager from '../level1/animated-manager';
import Bus from '../level1/bus';
import Matcher from '../level1/matcher';
import RunLoop from '../level1/runloop';

// level 2
import PreactCrawler from '../level2/preact-crawler';

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

    const manager = new AnimatedManager(animationTypes, bus, loop || RunLoop.main);

    this.crawler = new PreactCrawler(bus, matcher);
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
};
