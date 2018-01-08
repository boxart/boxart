import './source-map-support';

import 'babel-polyfill';

import {h} from 'preact';

import Bus from '../level1/bus';
import Matcher from '../level1/matcher';
import PreactNodeIdGenerator from './preact-node-id-generator';
import TransitionTree from './transition-tree';

import PreactElementTransition from './preact-element-transition';

let bus, matcher, transition, tree;
let a, b, c, d, e;
let elements;

beforeEach(() => {
  bus = new Bus();
  matcher = new Matcher();
  matcher.add('base', ['default']);
  matcher.add('canEnter', ['default', 'enter']);
  matcher.add('canLeave', ['default', 'leave']);
  tree = new TransitionTree(new PreactNodeIdGenerator(matcher));
  transition = new PreactElementTransition(bus, tree, matcher);
  a = h('div', {class: 'base base1'});
  b = h('div', {class: 'base base2'});
  c = h('div', {class: 'base base3'});
  d = h('div', {class: 'canEnter canEnter1'});
  e = h('div', {class: 'canLeave canLeave2'});
  elements = {
    a: document.createElement('div'),
    b: document.createElement('div'),
    c: document.createElement('div'),
    d: document.createElement('div'),
    e: document.createElement('div'),
  };
  elements.a.className = a.attributes.class;
  elements.b.className = b.attributes.class;
  elements.c.className = c.attributes.class;
  elements.d.className = d.attributes.class;
  elements.e.className = e.attributes.class;
  tree.get('root').update([a, c, e], [], []);
});

it('primes can{animation} tests', () => {
  bus.bind('element:create', 3)('canLeave', 'canLeave2', elements.e);
  expect(tree.get('root').meta('canLeave2').can)
  .toEqual({default: true, leave: true});
});

it('starts enter animation on element create', async () => {
  tree.get('root').count = 2;
  tree.get('root').update([a, c, d, e], [], []);
  const animationPromise = new Promise(resolve => {
    bus.on('state:change', (type, id, animation) => {
      resolve(animation);
    });
  });
  bus.bind('element:create', 3)('canEnter', 'canEnter1', elements.d);
  expect(await animationPromise).toBe('enter');
});

it('announces enter immediately', async () => {
  tree.get('root').count = 2;
  tree.get('root').update([a, c, d, e], [], []);
  let delayed = false;
  const delayedPromise = new Promise(resolve => {
    bus.on('state:change', (type, id, animation) => {
      resolve(delayed);
    });
  });
  bus.bind('element:create', 3)('canEnter', 'canEnter1', elements.d);
  await Promise.resolve();
  delayed = true;
  expect(await delayedPromise).toBe(false);
});

it('starts leave animation on element update', async () => {
  tree.get('root').meta('canLeave2').didLeave = true;
  const animationPromise = new Promise(resolve => {
    bus.on('state:change', (type, id, animation) => resolve(animation));
  });
  bus.bind('element:update', 3)('canLeave', 'canLeave2', elements.e);
  expect(await animationPromise).toBe('leave');
});

it('starts leave every update', async () => {
  tree.get('root').meta('canLeave2').didLeave = true;
  let animationPromise = new Promise(resolve => {
    bus.on('state:change', (type, id, animation) => resolve(animation));
  });
  bus.bind('element:update', 3)('canLeave', 'canLeave2', elements.e);
  expect(await animationPromise).toBe('leave');
  animationPromise = new Promise(resolve => {
    bus.on('state:change', (type, id, animation) => resolve(animation));
    setTimeout(() => resolve(), 10);
  });
  bus.bind('element:update', 3)('canLeave', 'canLeave2', elements.e);
  expect(await animationPromise).toBe('leave');
});

it('removes node from tree when element finishes end animation', async () => {
  bus.bind('state:end', 3)('canLeave', 'canLeave2', 'leave');
  await new Promise(r => setTimeout(r, 10));
  expect(tree.get('root').nodes['canLeave2']).toBeFalsy();
});
