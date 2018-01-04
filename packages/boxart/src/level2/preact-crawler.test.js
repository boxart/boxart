import './source-map-support';

import 'babel-polyfill';

import {h, Component} from 'preact';
import render from 'preact-render-spy';

import Bus from './bus';
import Matcher from './matcher';
import PreactCrawler from './preact-crawler';

let bus, matcher, crawler;

beforeEach(() => {
  const elementMap = new Map();
  bus = new Bus();
  // const create = bus.bind('element:create', 3);
  // bus.on('element:change', (type, id, element) => {
  //   if (elementMap.get(id) !== element) {
  //     create(type, id, element);
  //   }
  //   elementMap.set(id, element);
  // });
  // bus.on('element:destroy', (type, id) => {
  //   elementMap.set(id, null);
  // });

  matcher = new Matcher();
  crawler = new PreactCrawler(bus, matcher);
});

class Crawler {
  render({crawler, children}) {
    const injected = crawler.inject(children[0], 'crawler');
    return injected;
  }
}

it('shallow stateless', async () => {
  matcher.add('loader', ['loading', 'complete']);
  function Loader() {
    return <div key={Math.random()} class="loader loading" />;
  }

  let change = 0;
  let create = 0;
  let destroy = 0;
  bus.on('state:change', (type, id, animation) => {
    change++;
    expect(type).toBe('loader');
    expect(id).toBe('loader');
    expect(animation).toBe('loading');
  });
  bus.on('element:create', (type, id, element) => {
    create++;
    expect(type).toBe('loader');
    expect(id).toBe('loader');
    expect(element.tagName.toLowerCase()).toBe('div');
  });
  bus.on('element:destroy', (type, id) => {
    destroy++;
    expect(type).toBe('loader');
    expect(id).toBe('loader');
  });
  const ctx = render(<Crawler crawler={crawler}><Loader /></Crawler>);
  expect(change).toBe(1);
  expect(create).toBe(1);
  expect(destroy).toBe(0);
  ctx.render(<Crawler crawler={crawler}><Loader /></Crawler>);
  expect(change).toBe(2);
  expect(create).toBe(1);
  expect(destroy).toBe(0);
  ctx.render(<Crawler crawler={crawler}></Crawler>);
  expect(change).toBe(2);
  expect(create).toBe(1);
  expect(destroy).toBe(1);
});

it('deep stateless', async () => {
  matcher.add('loader', ['loading', 'complete']);
  function Loader() {
    return <div key="loading" class="loader loading" />;
  }
  let lc, de;
  function Page({loading}) {
    return <div key="page">{loading ? <Loader key="loader" /> : null}</div>;
  }

  let change = 0;
  let create = 0;
  let destroy = 0;
  bus.on('state:change', (type, id, animation) => {
    change++;
    expect(type).toBe('loader');
    expect(id).toBe('loader');
    expect(animation).toBe('loading');
  });
  bus.on('element:create', (type, id, element) => {
    create++;
    expect(type).toBe('loader');
    expect(id).toBe('loader');
    expect(element.tagName.toLowerCase()).toBe('div');
  });
  bus.on('element:destroy', (type, id) => {
    destroy++;
    expect(type).toBe('loader');
    expect(id).toBe('loader');
  });
  let pc;
  const ctx = render(<Crawler key="crawl" crawler={crawler}><Page key="page" ref={v => {pc = v;}} loading={true} /></Crawler>);
  expect(change).toBe(1);
  expect(create).toBe(1);
  expect(destroy).toBe(0);
  ctx.render(<Crawler key="crawl" crawler={crawler}><Page key="page" loading={true} /></Crawler>);
  expect(change).toBe(2);
  expect(create).toBe(1);
  expect(destroy).toBe(0);
  ctx.render(<Crawler key="crawl" crawler={crawler}><Page key="page" /></Crawler>);
  expect(change).toBe(2);
  expect(create).toBe(1);
  expect(destroy).toBe(1);
  ctx.render(<Crawler key="crawl" crawler={crawler}><Page key="page" loading="true" /></Crawler>);
  expect(change).toBe(3);
  expect(create).toBe(2);
  expect(destroy).toBe(1);
  ctx.render(<Crawler key="crawl" crawler={crawler}><Page key="page" /></Crawler>);
  expect(change).toBe(3);
  expect(create).toBe(2);
  expect(destroy).toBe(2);
});

it('shallow stateful', async () => {
  matcher.add('loader', ['loading', 'complete']);
  class Loader extends Component {
    render() {
      return <div key={Math.random()} class="loader loading" />;
    }
  }

  let change = 0;
  let create = 0;
  let destroy = 0;
  bus.on('state:change', (type, id, animation) => {
    change++;
    expect(type).toBe('loader');
    expect(id).toBe('loader');
    expect(animation).toBe('loading');
  });
  bus.on('element:create', (type, id, element) => {
    create++;
    expect(type).toBe('loader');
    expect(id).toBe('loader');
    expect(element.tagName.toLowerCase()).toBe('div');
  });
  bus.on('element:destroy', (type, id) => {
    destroy++;
    expect(type).toBe('loader');
    expect(id).toBe('loader');
  });
  const ctx = render(<Crawler crawler={crawler}><Loader /></Crawler>);
  expect(change).toBe(1);
  expect(create).toBe(1);
  expect(destroy).toBe(0);
  ctx.render(<Crawler crawler={crawler}><Loader /></Crawler>);
  expect(change).toBe(2);
  expect(create).toBe(1);
  expect(destroy).toBe(0);
  ctx.render(<Crawler crawler={crawler}></Crawler>);
  expect(change).toBe(2);
  expect(create).toBe(1);
  expect(destroy).toBe(1);
});

it('deep stateful', async () => {
  matcher.add('loader', ['loading', 'complete']);
  class Loader extends Component {
    render() {
      return <div key={Math.random()} class="loader loading" />;
    }
  }
  class Page extends Component {
    render({loading}) {
      return <div key="page">{loading ? <Loader key="loader" /> : null}</div>;
    }
  }

  let change = 0;
  let create = 0;
  let destroy = 0;
  bus.on('state:change', (type, id, animation) => {
    change++;
    expect(type).toBe('loader');
    expect(id).toBe('loader');
    expect(animation).toBe('loading');
  });
  bus.on('element:create', (type, id, element) => {
    create++;
    expect(type).toBe('loader');
    expect(id).toBe('loader');
    expect(element.tagName.toLowerCase()).toBe('div');
  });
  bus.on('element:destroy', (type, id) => {
    destroy++;
    expect(type).toBe('loader');
    expect(id).toBe('loader');
  });
  let pc;
  const ctx = render(<Crawler key="crawl" crawler={crawler}><Page key="page" loading={true} /></Crawler>);
  expect(change).toBe(1);
  expect(create).toBe(1);
  expect(destroy).toBe(0);
  ctx.render(<Crawler key="crawl" crawler={crawler}><Page key="page" loading={true} /></Crawler>);
  expect(change).toBe(2);
  expect(create).toBe(1);
  expect(destroy).toBe(0);
  ctx.render(<Crawler key="crawl" crawler={crawler}><Page key="page" /></Crawler>);
  expect(change).toBe(2);
  expect(create).toBe(1);
  expect(destroy).toBe(1);
  ctx.render(<Crawler key="crawl" crawler={crawler}><Page key="page" loading={true} /></Crawler>);
  expect(change).toBe(3);
  expect(create).toBe(2);
  expect(destroy).toBe(1);
  ctx.render(<Crawler key="crawl" crawler={crawler}><Page key="page" /></Crawler>);
  expect(change).toBe(3);
  expect(create).toBe(2);
  expect(destroy).toBe(2);
});
