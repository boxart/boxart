import 'babel-polyfill';

require('source-map-support').install({requireHook: true});

const {default: State, ORDER} = require('./state');

const timeout = ms => new Promise(resolve => setTimeout(resolve, ms));
const cancelable = (p, handle) => Promise.race([p, new Promise(handle)]);
const cancelation = () => Promise.resolve().then(() => Promise.resolve());

it('has an initial state', () => {
  expect(new State().get()).toBeTruthy();
});

it('start the next state immediately', () => {
  for (const order of Object.values(ORDER)) {
    let s = new State();
    s.set({state: 'new', order});
    expect(s.get()).toEqual('new');
  }
});

it('replaces a current transition (ORDER.IMMEDIATE)', async () => {
  const s = new State();
  let cancel;
  s.set({
    state: 'first',
    transition: () => cancelable(timeout(10), _c => cancel = _c),
    cancel: () => cancel()
  });
  expect(s.get()).toEqual('first');
  s.set({state: 'second', order: ORDER.IMMEDIATE});
  await cancelation();
  expect(s.get()).toEqual('second');
});

it('set the state (ORDER.NEXT)', () => {
  const s = new State();
  s.set({state: 'first', transition: () => timeout(10)});
  expect(s.get()).toEqual('first');
  s.set({state: 'second', order: ORDER.NEXT});
  expect(s.get()).toEqual('first');
  return timeout(10)
  .then(() => expect(s.get()).toEqual('second'));
});

it('replaces the queued transitions (ORDER.IMMEDIATE)', async () => {
  const s = new State();
  let cancel;
  s.set({
    state: 'first',
    transition: () => cancelable(timeout(10), c => {cancel = c;}),
    cancel: () => cancel(),
  });
  expect(s.get()).toEqual('first');
  s.set({state: 'second', order: ORDER.NEXT, transition: () => timeout(10)});
  expect(s.get()).toEqual('first');
  s.set({state: 'third', order: ORDER.IMMEDIATE});
  await cancelation();
  expect(s.get()).toEqual('third');
});

it('replaces the queued transitions (ORDER.NEXT)', async () => {
  const s = new State();
  s.set({state: 'first', transition: () => timeout(10)});
  expect(s.get()).toEqual('first');
  s.set({state: 'second', order: ORDER.NEXT, transition: () => timeout(10)});
  s.set({state: 'third', order: ORDER.NEXT, transition: () => timeout(10)});
  expect(s.get()).toEqual('first');
  await timeout(10);
  expect(s.get()).toEqual('third');
});

it('set the state eventually (ORDER.QUEUE)', () => {
  const s = new State();
  s.set({state: 'first', transition: () => timeout(10)});
  expect(s.get()).toEqual('first');
  s.set({state: 'second', order: ORDER.QUEUE, transition: () => timeout(10)});
  s.set({state: 'third', order: ORDER.QUEUE, transition: () => timeout(10)});
  expect(s.get()).toEqual('first');
  return timeout(10)
  .then(() => expect(s.get()).toEqual('second'))
  .then(() => timeout(10))
  .then(() => expect(s.get()).toEqual('third'));
});

it('cancels current transition (ORDER.IMMEDIATE)', () => {
  const s = new State();
  let canceled = false;
  s.set({state: 'first', transition: () => timeout(10), cancel: () => {canceled = true;}});
  s.set({state: 'second', order: ORDER.IMMEDIATE});
  expect(canceled).toBeTruthy();
});

it('cancels future transition (ORDER.IMMEDIATE)', () => {
  const s = new State();
  let canceled = false;
  s.set({state: 'first', transition: () => timeout(10)});
  s.set({state: 'second', transition: () => timeout(10), cancel: () => {canceled = true;}});
  s.set({state: 'third', order: ORDER.IMMEDIATE});
  expect(canceled).toBeTruthy();
});


it('cancels future transition (ORDER.NEXT)', () => {
  const s = new State();
  let canceled = false;
  s.set({state: 'first', transition: () => timeout(10)});
  s.set({state: 'second', transition: () => timeout(10), cancel: () => {canceled = true;}});
  s.set({state: 'third'});
  expect(canceled).toBeTruthy();
});

it('resolves setThen when transition completes', async () => {
  const s = new State();
  await s.setThen({state: 'first', transition: () => timeout(10)});
  expect(s.get()).toEqual('first');
});

it('resolves setThen when transition completes', async () => {
  const s = new State();
  s.setThen({state: 'first', transition: () => timeout(10)});
  await s.setThen({state: 'second', transition: () => timeout(10)});
  expect(s.get()).toEqual('second');
});

it('resolves setThen when transition is canceled', async () => {
  const s = new State();
  let cancel;
  const p = s.setThen({
    state: 'first',
    transition: () => cancelable(timeout(10), c => {cancel = c;}),
    cancel: () => cancel(),
  });
  s.setThen({state: 'second', order: ORDER.IMMEDIATE});
  await p;
  await cancelation();
  expect(s.get()).toEqual('second');
});
