import Bus from './bus';

let bus;

beforeEach(() => {
  bus = new Bus();
});

it('returns a bound function for name:sub pattern', () => {
  expect(typeof bus.bind('name:sub')).toBe('function');
  expect(typeof bus.bind('count:other', 1)).toBe('function');
});

it('registers handle for name:* pattern', () => {
  const fn = bus.bind('name:sub');
  let called = 0;
  const off = bus.on('name:*', (b, v) => {
    expect(b).toBe('sub');
    expect(v).toBe('value');
    called += 1;
  });
  fn('value');
  expect(called).toBe(1);
  off();
  fn('value');
  expect(called).toBe(1);
});

it('registers handle for name:sub pattern', () => {
  const fn = bus.bind('name:sub');
  let called = 0;
  const off = bus.on('name:sub', v => {
    expect(v).toBe('value');
    called += 1;
  });
  fn('value');
  expect(called).toBe(1);
  off();
  fn('value');
  expect(called).toBe(1);
});
