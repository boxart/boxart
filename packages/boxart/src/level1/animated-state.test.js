import 'babel-polyfill';

import animate from '../level0/animate';
import AnimatedState from './animated-state';
import update from '../level0/update';
import present from '../level0/present';
import RunLoop from './runloop';

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
        left: update.value((state, element) => (
          element.getBoundingClientRect().left
        )),
      }),
      animate: animate.object({
        left: animate.to(animate.begin(), animate.end()),
      }).duration(0.5),
      present: present.style({
        transform: present.translatex([present.key('left').px()]),
      }),
    },
  };
};

const wait = () => Promise.resolve().then(() => Promise.resolve());
const timeout = ms => new Promise(resolve => setTimeout(resolve, ms));

let animated = null;
let _animations = animations();
let state = null;

beforeEach(() => {
  // Let the animations have enough time to compile the first time.
  jest.setTimeout(30000);
  animated = render();
  state = new AnimatedState(_animations);
});

afterEach(() => {
  state.unschedule();
});

it('creates an AnimatedState', () => {
  expect(state).toBeTruthy();
});

it('stores state once pending', async () => {
  state.schedule(animated, RunLoop.main);
  state.set('default');
  await wait();
  expect(state.data.state.left).toBe(0);
});

it('modifies presentation while animating', async () => {
  state.schedule(animated, RunLoop.main);
  state.set('default');
  await wait();
  animated.root.element.style.left = '50px';
  state.set('default');
  await timeout(17);
  expect(state.data.end.left).toBe(50);
  expect(state.data.state.left).not.toBe(0);
  expect(state.data.state.left).not.toBe(50);
});

it('restores state after animating', async () => {
  state.schedule(animated, RunLoop.main);
  state.set('default');
  await wait();
  animated.root.element.style.left = '50px';
  state.set('default');
  await timeout(17);
  expect(animated.root.element.style.transform).not.toBe('');
  await timeout(500);
  expect(animated.root.element.style.transform).toBe('');
});

it('resolves its running promise after animating', async () => {
  state.schedule(animated, RunLoop.main);
  await wait();
  animated.root.element.style.left = '50px';
  const running = state.setThen('default');
  await timeout(17);
  await running;
  expect(animated.root.element.style.transform).toBe('');
});

it('restores state when unscheduled in the middle of animation', async () => {
  state.schedule(animated, RunLoop.main);
  await wait();
  animated.root.element.style.left = '50px';
  state.set('default');
  await timeout(100);
  state.unschedule();
  expect(animated.root.element.style.transform).toBe('');
});

it('modifies presentation when animating is rescheduled', async () => {
  state.schedule(animated, RunLoop.main);
  await wait();
  animated.root.element.style.left = '50px';
  state.set('default');
  await timeout(100);
  state.unschedule();
  await timeout(100);
  state.schedule(animated, RunLoop.main);
  await timeout(100);
  expect(animated.root.element.style.transform).not.toBe('');
});

it('modifies presentation when animating is rescheduled [2]', async () => {
  state.schedule(animated, RunLoop.main);
  await wait();
  animated.root.element.style.left = '50px';
  state.set('default');
  await timeout(100);
  state.unschedule();
  expect(animated.root.element.style.transform).toBe('');
  await timeout(100);
  state.schedule(animated, RunLoop.main);
  state.unschedule();
  expect(animated.root.element.style.transform).toBe('');
  await timeout(100);
  state.schedule(animated, RunLoop.main);
  await timeout(100);
  expect(animated.root.element.style.transform).not.toBe('');
});

it('modifies presentation when animating is rescheduled [3]', async () => {
  state.schedule(animated, RunLoop.main);
  await wait();
  animated.root.element.style.left = '50px';
  state.set('default');
  await timeout(100);
  state.unschedule();
  expect(animated.root.element.style.transform).toBe('');
  await timeout(100);
  state.schedule(animated, RunLoop.main);
  expect(animated.root.element.style.transform).toBe('');
  await wait();
  state.unschedule();
  expect(animated.root.element.style.transform).toBe('');
  await timeout(100);
  state.schedule(animated, RunLoop.main);
  expect(animated.root.element.style.transform).toBe('');
  await timeout(100);
  expect(animated.root.element.style.transform).not.toBe('');
});

it('restores original presentation after rescheduled animation', async () => {
  state.schedule(animated, RunLoop.main);
  state.set('default');
  await wait();
  animated.root.element.style.left = '50px';
  state.set('default');
  await timeout(100);
  state.unschedule();
  await timeout(100);
  state.schedule(animated, RunLoop.main);
  await timeout(517);
  expect(animated.root.element.style.transform).toBe('');
});

it('resolves its running promise after rescheduled animation', async () => {
  state.schedule(animated, RunLoop.main);
  await wait();
  animated.root.element.style.left = '50px';
  state.set('default');
  const running = state.running;
  await timeout(100);
  state.unschedule();
  await timeout(100);
  state.schedule(animated, RunLoop.main);
  await running;
  expect(animated.root.element.style.transform).toBe('');
});

it('restore during animation', async () => {
  state.schedule(animated, RunLoop.main);
  await wait();
  animated.root.element.style.left = '50px';
  state.set('default');
  await timeout(100);
  expect(animated.root.element.style.transform).not.toBe('');
  state.unschedule();
  expect(animated.root.element.style.transform).toBe('');
});

it('store after restore during animation', async () => {
  state.schedule(animated, RunLoop.main);
  state.set('default');
  await wait();
  animated.root.element.style.left = '50px';
  state.set('default');
  await timeout(100);
  expect(animated.root.element.style.transform).not.toBe('');
  state.unschedule();
  expect(animated.root.element.style.transform).toBe('');
  state.schedule(animated, RunLoop.main);
  await timeout(100);
  expect(animated.root.element.style.transform).not.toBe('');
  await timeout(517);
  expect(animated.root.element.style.transform).toBe('');
});

it('resolves its running promise after storing during animation', async () => {
  state.schedule(animated, RunLoop.main);
  await wait();
  animated.root.element.style.left = '50px';
  state.set('default');
  await timeout(100);
  expect(animated.root.element.style.transform).not.toBe('');
  state.unschedule();
  expect(animated.root.element.style.transform).toBe('');
  await state.running;
  expect(animated.root.element.style.transform).toBe('');
});
