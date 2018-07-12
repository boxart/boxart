import {h, Component} from 'preact';

import {Page} from './page';

import pages from './pages';

class App extends Component {
  render() {
    return h('div', null,
      []
      .concat(pages.keys().map(page => h(Page, {page: pages(page)})))
    );
  }
}

export {App};
