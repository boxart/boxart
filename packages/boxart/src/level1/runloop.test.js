import 'babel-polyfill';

import RunLoop from './runloop';

let requestFrame, cancelFrame, waitFrame, frameId, loop;

beforeEach(() => {
  let nextId = 0;
  const funcs = [];
  requestFrame = fn => {
    const id = nextId++;
    funcs.push({id, fn});
  };
  cancelFrame = id => {
    funcs.splice(funcs.findIndex(f => f.id === id), 1);
  };
  waitFrame = () => new Promise(resolve => requestFrame(resolve));
  const step = () => {
    frameId = setTimeout(step, 0);
    const slice = funcs.slice();
    funcs.length = 0;
    for (let func of slice) {
      if (func && func.fn) {func.fn();}
    }
  };

  // stop = false;
  frameId = setTimeout(step, 0);

  loop = new RunLoop({
    requestFrame,
    cancelFrame,
  });
});

afterEach(() => {
  loop.pause();
  clearTimeout(frameId);
});

it('calls scheduled function', async () => {
  await new Promise(resolve => loop.schedule(resolve));
});

it('calls scheduled function multiple times', async () => {
  await new Promise(resolve => {
    let i = 0;
    loop.schedule(() => {
      if (i++ > 2) {resolve(); }
    });
  });
});

it('does not call unscheduled function', async () => {
  let i = 0;
  const fn = () => {
    i++;
    if (i >= 2) {
      loop.unschedule(fn);
    }
  };
  loop.schedule(fn);
  await waitFrame();
  expect(i).toBe(1);
  await waitFrame();
  expect(i).toBe(2);
  await waitFrame();
  expect(i).toBe(2);
});

it('calls once function', async () => {
  let i = 0;
  const fn = () => {i++;};
  loop.once(fn);
  await waitFrame();
  await waitFrame();
  expect(i).toBe(1);
});

it('calls item', async () => {
  await new Promise(resolve => loop.add(function() {resolve();}));
});

it('calls item multiple times', async () => {
  await new Promise(resolve => {
    let i = 0;
    loop.add(function() {
      if (i++ > 2) {resolve();}
    });
  });
});

it('does not call removed items', async () => {
  let i = 0;
  const item = function() {
    i++;
    if (i >= 2) {
      loop.remove(item);
    }
  };
  loop.add(item);
  await waitFrame();
  expect(i).toBe(1);
  await waitFrame();
  expect(i).toBe(2);
  await waitFrame();
  expect(i).toBe(2);
});
