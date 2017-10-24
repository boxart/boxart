import builder from './function-registry';

const animate = builder(() => {
  const value = fn => {
    const f = (t, state, begin, end) => fn(t, state, begin, end);
    f.a = (a, t, state, begin, end) => fn(t, state, begin, end);
    f.eq = (t, state, begin, end) => fn(t, state, begin, end) == fn(1, state, begin, end);
    f.clone = state => state;
    f.copy = (dest, src) => src;
    return f;
  };

  const lerp = fn => {
    const f = (t, state, begin, end) => {
      return fn(t, state, begin, end);
    };
    f.a = (a, t, state, begin, end) => {
      const b = f(t, state, begin, end);
      const e = a(t, state, begin, end);
      return (e - b) * Math.min(1, t) + b;
    };
    f.eq = (t, state, begin, end) => t >= 1;
    f.clone = state => state;
    f.copy = (dest, src) => src;
    return f;
  };

  const constant = c => lerp(() => c);

  const at = pos => {
    return lerp((t, state, begin, end) => {
      return (end - begin) * pos + begin;
    });
  }

  const begin = () => at(0);
  const end = () => at(1);

  // assert.equal(at(0)(0, 0, 0, 1), 0);
  // assert.equal(at(0.5)(0, 0, 0, 1), 0.5);
  // assert.equal(at(1)(0, 0, 0, 1), 1);
  // assert.equal(at(0).a(at(1), 0, 0, 0, 1), 0);
  // assert.equal(at(0).a(at(1), 0.5, 0, 0, 1), 0.5);
  // assert.equal(at(0).a(at(1), 1, 0, 0, 1), 1);
  // assert.equal(at(0).a(at(0.5), 1, 0, 0, 1), 0.5);
  // assert.equal(at(0.5).a(at(1), 0, 0, 0, 1), 0.5);
  // assert.equal(at(1).a(at(0), 0, 0, 0, 1), 1);
  // assert.equal(at(1).a(at(0), 1, 0, 0, 1), 0);

  const velocity = (posfn, velocityKey = '__velocity') => {
    const f = (t, state, begin, end) => posfn(t, state, begin, end);
    f.a = (otherposfn, t, state, begin, end) => {
      const b = posfn(t, state, begin, end);
      const e = otherposfn(t, state, begin, end);
      // Consider the needed velocity for the following lines.
      const n = e - b;
      // Devide old velocity by needed velocity. If they are the same sign, the
      // value will be positive. If less than 1 max will increase it to one.
      // This handles making sure the used velocity has a matching sign to the
      // needed velocity. With this we create a ratio of the velocity over the
      // needed velocity.
      const r = Math.max(1, state[velocityKey] / n);
      // Update the stored velocity by multiple the needed velocity by the ratio
      // turning it back into the original velocity or the new needed velocity.
      state[velocityKey] = r * n;
      // Perform the normal `at` interpolation using the ratio to manipulate the
      // t value.
      return n * Math.min(1, r * t) + b;
    };
    f.eq = (t, state, begin, end) => posfn(t, state, begin, end);
    f.clone = state => state;
    f.copy = (dest, src) => src;
    return f;
  };

  // velocity(at(0), 'v').to(at(1))
  // velocity(0, 'v').to(velocity(1, 'v'))

  const fromTo = ([a, b]) => {
    const f = (t, state, begin, end) => a.a(b, t, state, begin, end);
    f.eq = (...args) => b.eq(...args);
    f.clone = state => a.clone(state);
    f.copy = (dest, src) => a.copy(dest, src);
    return f;
  };

  const to = (a, b) => fromTo([a, b]);

  const keyframes = frames => {
    const timeSum = frames.reduce((carry, frame) => carry + frame.timer.t, 0);
    const lastFrame = frames[frames.length - 1];
    const f = (t, state, begin, end) => {
      let i = 0;
      for (; i < frames.length - 1; i++) {
        t -= frames[i].timer.t;
        if (t < 0) {
          return frames[i].a(frames[i + 1], frames[i].timer.t + t, state, begin, end);
        }
      }
      return lastFrame(lastFrame.timer.t, state, begin, end);
    };
    f.eq = (t, state, begin, end) => t >= timeSum;
    f.clone = state => lastFrame.fn.clone(state);
    f.copy = (dest, src) => lastFrame.fn.copy(dest, src);
    return f;
  };

  const frame = (timer, fn) => {
    const f = (t, state, begin, end) => fn(timer(t), state, begin, end);
    f.eq = (t, state, begin, end) => timer(t) >= 1;
    f.timer = timer;
    f.fn = fn;
    return f;
  };

  const seconds = s => {
    const f = t => t / s;
    f.t = s;
    return f;
  };

  const milliseconds = ms => {
    const f = t => t / (ms / 1000);
    f.t = ms / 1000;
    return f;
  };

  const percent = p => {
    const f = t => t / (p / 100);
    f.t = p / 100;
    return f;
  };

  const t = _t => {
    const f = t => t / _t;
    f.t = _t;
    return f;
  };

  frame.s = (s, fn) => frame(seconds(s), fn);
  frame.ms = (ms, fn) => frame(milliseconds(ms), fn);
  frame.percent = (p, fn) => frame(percent(p), fn);
  frame.t = (_t, fn) => frame(t(_t), fn);

  // assert.equal(fromTo([at(0), at(1)])(0, 0, 0, 1), 0);
  // assert.equal(fromTo([at(0), at(1)])(0.5, 0, 0, 1), 0.5);
  // assert.equal(fromTo([at(0), at(1)])(1, 0, 0, 1), 1);
  // assert.equal(fromTo([at(0), at(0.5)])(1, 0, 0, 1), 0.5);
  // assert.equal(fromTo([at(0.5), at(1)])(0, 0, 0, 1), 0.5);
  // assert.equal(fromTo([at(1), at(0)])(0, 0, 0, 1), 1);

  const object = o => {
    const entries = Object.entries(o);
    const f = (t, state, begin, end) => {
      for (let [key, value] of entries) {
        state[key] = value(t, state[key], begin[key], end[key]);
      }
      return state;
    };
    f.a = (a, t, state, begin, end) => {
      for (let [key, value] of entries) {
        state[key] = value.a(a.o[key], t, state[key], begin[key], end[key]);
      }
      return state;
    };
    f.eq = (t, state, begin, end) => {
      for (let [key, value] of entries) {
        if (!value.eq(t, state[key], begin[key], end[key])) {
          return false;
        }
      }
      return true;
    };
    f.clone = state => {
      const obj = {};
      for (let [key, value] of entries) {
        obj[key] = value.clone(state[key]);
      }
      return obj;
    };
    f.copy = (dest, src) => {
      dest = dest || {};
      for (let [key, value] of entries) {
        dest[key] = value.copy(dest[key], src[key]);
      }
      return dest;
    };
    f.o = o;
    return f;
  }

  // assert.equal(object({a: fromTo([at(0), at(1)])})(0, {a: 0}, {a: 0}, {a: 1}).a, 0);
  // assert.equal(object({a: fromTo([at(0), at(1)])})(0.5, {a: 0}, {a: 0}, {a: 1}).a, 0.5);
  // assert.equal(object({a: fromTo([at(0), at(1)])})(1, {a: 0}, {a: 0}, {a: 1}).a, 1);
  // assert.equal(fromTo([object({a: at(0)}), object({a: at(1)})])(0, {a: 0}, {a: 0}, {a: 1}).a, 0);
  // assert.equal(fromTo([object({a: at(0)}), object({a: at(1)})])(0.5, {a: 0}, {a: 0}, {a: 1}).a, 0.5);
  // assert.equal(fromTo([object({a: at(0)}), object({a: at(1)})])(1, {a: 0}, {a: 0}, {a: 1}).a, 1);

  const easing = (fn, tfn) => {
    const f = (t, state, begin, end) => {
      return fn(tfn(t, state, begin, end), state, begin, end);
    };
    f.eq = (t, state, begin, end) => fn.eq(tfn(t, state, begin, end), state, begin, end);
    f.clone = state => fn.clone(state);
    f.copy = (dest, src) => fn.copy(dest, src);
    return f;
  };

  const duration = (seconds, fn) => {
    if (typeof seconds !== 'number') {
      const tmp = seconds;
      seconds = fn;
      fn = tmp;
    }
    const halfSeconds = seconds / 2;
    const tfn = (t, begin) => Math.min(1, t / (seconds - (begin.tsub < halfSeconds ? begin.tsub : 0)));
    const f = (t, state, begin, end) => {
      return fn(tfn(t, begin), state, begin, end);
    };
    f.eq = (t, state, begin, end) => fn.eq(tfn(t, begin), state, begin, end);
    // f.eq = t => t / seconds >= 1;
    f.clone = state => fn.clone(state);
    f.copy = (dest, src) => fn.copy(dest, src);
    return f;
  };

  // const persistTime = (fn, key = 't') => {
  //   const f = (t, state, begin, end) => {
  //     if (state[key] && t < state[key]) {
  //       t += state[key];
  //       state[key] = state[key] + (t - state[key]);
  //       state[key] = t;
  //       return fn(state[key])
  //     }
  //     else if (state[key] && t > state[key]) {
  //
  //     }
  //   };
  //   f.eq = (t, state, begin, end) => {
  //
  //   };
  //   f.clone = state => fn.clone(state);
  //   f.copy = (dest, src) => fn.copy(dest, src);
  //   return f;
  // };

  return {
    at,
    begin,
    constant,
    duration,
    easing,
    end,
    fromTo,
    lerp,
    keyframes,
    frame,
    seconds,
    object,
    to,
    value,
    velocity,
  };
}).freeze();

export const at = animate.at;
export const begin = animate.begin;
export const constant = animate.constant;
export const duration = animate.duration;
export const easing = animate.easing;
export const end = animate.end;
export const fromTo = animate.fromTo;
export const lerp = animate.lerp;
export const object = animate.object;
export const to = animate.to;
export const value = animate.value;

export default animate;
