import 'babel-polyfill';

import animate from './animate';
import AnimatedState from './animated-state';
import update from './update';
import present from './present';

const render = () => {
  const animated = {
    root: {
      element: {
        style: {
          left: '',
          transform: '',
        },
        getBoundingClientRect() {
          return {
            left: this.style.left ? Number(this.style.left.split('px')[0]) : 0,
          };
        },
      },
    },
  };

  // const root = document.createElement('div');
  // animated.root = {element: root};
  // root.style.position = 'absolute';
  // root.style.width = '50px';
  // root.style.height = '50px';
  // document.body.appendChild(root);

  return animated;
};

const animations = () => {
  return {
    default: {
      update: update.object({
        left: update.value(element => element.getBoundingClientRect().left),
      }),
      animate: animate.object({
        left: animate.fromTo([animate.begin(), animate.end()]),
      }).duration(0.5),
      present: present.styles({
        transform: present.translatex([present.key('left').px()]),
      }),
    },
  };
};

const wait = () => Promise.resolve().then(() => Promise.resolve());
const timeout = ms => new Promise(resolve => setTimeout(resolve, ms));

let animated = null;
let _animations = null;
let state = null;

beforeEach(() => {
  animated = render();
  _animations = animations();
  state = new AnimatedState(_animations);
});

afterEach(() => {
  state.unschedule();
});

it('creates an AnimatedState', () => {
  expect(state).toBeTruthy();
});

it('stores state after scheduling', async () => {
  state.schedule(animated);
  await wait();
  expect(state.data.state.left).toBe(0);
});

it('modifies presentation while animating', async () => {
  state.schedule(animated);
  await wait();
  animated.root.element.style.left = '50px';
  state.set('default');
  await timeout(17);
  expect(state.data.end.left).toBe(50);
  expect(state.data.state.left).not.toBe(0);
  expect(state.data.state.left).not.toBe(50);
});

it('restores state after animating', async () => {
  state.schedule(animated);
  await wait();
  animated.root.element.style.left = '50px';
  state.set('default');
  await timeout(17);
  expect(animated.root.element.style.transform).not.toBe('');
  await timeout(500);
  expect(animated.root.element.style.transform).toBe('');
});

it('resolves its running promise after animating', async () => {
  state.schedule(animated);
  await wait();
  animated.root.element.style.left = '50px';
  state.set('default');
  await state.running;
  expect(animated.root.element.style.transform).toBe('');
});

it('restores state when unscheduled in the middle of animation', async () => {
  state.schedule(animated);
  await wait();
  animated.root.element.style.left = '50px';
  state.set('default');
  await timeout(100);
  state.unschedule();
  expect(animated.root.element.style.transform).toBe('');
});

it('modifies presentation when animating is rescheduled', async () => {
  state.schedule(animated);
  await wait();
  animated.root.element.style.left = '50px';
  state.set('default');
  await timeout(100);
  state.unschedule();
  await timeout(100);
  state.schedule(animated);
  await timeout(100);
  expect(animated.root.element.style.transform).not.toBe('');
});

it('modifies presentation when animating is rescheduled [2]', async () => {
  state.schedule(animated);
  await wait();
  animated.root.element.style.left = '50px';
  state.set('default');
  await timeout(100);
  state.unschedule();
  expect(animated.root.element.style.transform).toBe('');
  await timeout(100);
  state.schedule(animated);
  state.unschedule();
  expect(animated.root.element.style.transform).toBe('');
  await timeout(100);
  state.schedule(animated);
  await timeout(100);
  expect(animated.root.element.style.transform).not.toBe('');
});

it('modifies presentation when animating is rescheduled [3]', async () => {
  state.schedule(animated);
  await wait();
  animated.root.element.style.left = '50px';
  state.set('default');
  await timeout(100);
  state.unschedule();
  expect(animated.root.element.style.transform).toBe('');
  await timeout(100);
  state.schedule(animated);
  expect(animated.root.element.style.transform).toBe('');
  await wait();
  state.unschedule();
  expect(animated.root.element.style.transform).toBe('');
  await timeout(100);
  state.schedule(animated);
  expect(animated.root.element.style.transform).toBe('');
  await timeout(100);
  expect(animated.root.element.style.transform).not.toBe('');
});

it('restores original presentation after rescheduled animation', async () => {
  state.schedule(animated);
  await wait();
  animated.root.element.style.left = '50px';
  state.set('default');
  await timeout(100);
  state.unschedule();
  await timeout(100);
  state.schedule(animated);
  await timeout(500);
  expect(animated.root.element.style.transform).toBe('');
});

it('resolves its running promise after rescheduled animation', async () => {
  state.schedule(animated);
  await wait();
  animated.root.element.style.left = '50px';
  state.set('default');
  const running = state.running;
  await timeout(100);
  state.unschedule();
  await timeout(100);
  state.schedule(animated);
  await running;
  expect(animated.root.element.style.transform).toBe('');
});

it('restore during animation', async () => {
  state.schedule(animated);
  await wait();
  animated.root.element.style.left = '50px';
  state.set('default');
  await timeout(100);
  expect(animated.root.element.style.transform).not.toBe('');
  state.restore();
  expect(animated.root.element.style.transform).toBe('');
});

it('store after restore during animation', async () => {
  state.schedule(animated);
  await wait();
  animated.root.element.style.left = '50px';
  state.set('default');
  await timeout(100);
  expect(animated.root.element.style.transform).not.toBe('');
  state.restore();
  expect(animated.root.element.style.transform).toBe('');
  state.store();
  await timeout(100);
  expect(animated.root.element.style.transform).not.toBe('');
  await timeout(400);
  expect(animated.root.element.style.transform).toBe('');
});

it('resolves its running promise after storing during animation', async () => {
  state.schedule(animated);
  await wait();
  animated.root.element.style.left = '50px';
  state.set('default');
  await timeout(100);
  expect(animated.root.element.style.transform).not.toBe('');
  state.restore();
  expect(animated.root.element.style.transform).toBe('');
  await state.running;
  expect(animated.root.element.style.transform).toBe('');
});
