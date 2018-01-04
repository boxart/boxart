import './source-map-support';

import {h} from 'preact';

import Bus from './bus';
import Matcher from './matcher';
import PreactNodeIdGenerator from './preact-node-id-generator';
import TransitionTree from './transition-tree';

import PreactTransition from './preact-transition';

let bus, crawler, matcher, transition, tree;
let a, b, c, d, e;

beforeEach(() => {
  bus = new Bus();
  matcher = new Matcher();
  matcher.add('base', ['default']);
  matcher.add('canLeave', ['default', 'leave']);
  tree = new TransitionTree(new PreactNodeIdGenerator(matcher));
  crawler = {
    inject(v) {return v;},
    children(v) {return v;},
  };
  transition = new PreactTransition(crawler, bus, tree, matcher);
  a = h('div', {class: 'base base1'});
  b = h('div', {class: 'base base2'});
  c = h('div', {class: 'base base3'});
  d = h('div', {class: 'canLeave canLeave1'});
  e = h('div', {class: 'canLeave canLeave2'});
  crawler.children([a, c, e], 'root');
  tree.get('root').meta('canLeave2').can = matcher.results.canLeave.hasAnimation;
});

it('does not change list with same nodes', () => {
  const list = [a, c, e];
  expect(crawler.children(list, 'root')).toBe(list);
});

it('does not change list with same nodes in new order', () => {
  const list = [a, e, c];
  expect(crawler.children(list, 'root')).toBe(list);
});

it('does not change list with new nodes', () => {
  const list = [a, c, b, e];
  expect(crawler.children(list, 'root')).toBe(list);
});

it('does not change list missing old nodes that cannot leave', () => {
  const list = [c, e];
  expect(crawler.children(list, 'root')).toBe(list);
});

it('changes list missing old nodes that can leave', () => {
  expect(tree.get('root').meta('canLeave2').can)
  .toEqual({default: true, leave: true});
  const list = [a, c];
  const result = crawler.children(list, 'root');
  expect(result).not.toBe(list);
  expect(result).toEqual([e, a, c]);
});

it('keeps missing old nodes that are still leaving', () => {
  const list = [a, c];
  const result = crawler.children(list, 'root');
  const result2 = crawler.children(list, 'root');
  expect(result2).toEqual([e, a, c]);
  tree.get('root').remove('canLeave2');
  const result3 = crawler.children(list, 'root');
  expect(result3).toEqual([a, c]);
});
