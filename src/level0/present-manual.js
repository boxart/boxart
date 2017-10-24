import builder from './function-registry';

// const compose = (fn0, ...fns) => {
//   const f = (element, state, animated) => {
//     let v = fn0(element, state, animated);
//     for (let fn of fns) {
//       v = fn(element, v, animated);
//     }
//     return v;
//   };
//   f.store = (state, element) => {
//     let v = fn0.store(state, element);
//     for (let fn of fns) {
//       v = fn.store(state, v);
//     }
//     return v;
//   };
//   f.restore = (element, state) => {
//     let v = fn0.restore(element, state);
//     for (let fn of fns) {
//       v = fn.restore(element, v);
//     }
//     return v;
//   };
//   return f;
// };

const present = builder(() => {
  const value = fn => {
    let f;
    if (typeof fn === 'string') {
      f = () => fn;
      f.value = () => fn;
    }
    if (typeof fn === 'function') {
      if (fn.value && fn.store) {
        return fn;
      }
      else if (fn.value) {
        f = (element, state, animated) => f.value(state, animated);
        f.value = (state, animated) => fn.value(state, animated);
      }
      else {
        f = (element, state, animated) => fn(state, animated);
        f.value = (state, animated) => fn(state, animated);
      }
    }

    if (fn.store) {
      f.store = (state, element) => fn.store(state, element);
      f.restore = (element, state) => fn.restore(element, state);
    }
    else {
      f.store = (state, element) => element;
      f.restore = (element, state) => state;
    }

    return f;
  };

  const begin = fn => value((state, animated) => fn(null, animated.begin, animated));
  const end = fn => value((state, animated) => fn(null, animated.end, animated));

  const constant = constantValue => value(() => constantValue);
  const key = key => value(state => state[key]);
  const path = p => p.reduceRight((carry, k) => value(state => carry.value(state[k])), value(state => state));

  const suffix = (fn, suffix) => value((state, animated) => fn(null, state, animated) + suffix);
  const em = fn => suffix(fn, 'em');
  const percent = fn => suffix(fn, '%');
  const deg = fn => suffix(fn, 'deg');
  const rad = fn => suffix(fn, 'rad');
  const px = fn => suffix(fn, 'px');
  const rem = fn => suffix(fn, 'rem');
  const vh = fn => suffix(fn, 'vh');
  const vmax = fn => suffix(fn, 'vmax');
  const vmin = fn => suffix(fn, 'vmin');
  const vw = fn => suffix(fn, 'vw');

  const op = (a, b, o) => value((state, animated) => o(a(null, state, animated), b(null, state, animated)));
  const add = (a, b) => op(a, b, (a, b) => a + b);
  const subtract = (a, b) => op(a, b, (a, b) => a - b);
  const sub = (a, b) => op(a, b, (a, b) => a - b);
  const multiply = (a, b) => op(a, b, (a, b) => a * b);
  const mul = (a, b) => op(a, b, (a, b) => a * b);
  const divide = (a, b) => op(a, b, (a, b) => a / b);
  const div = (a, b) => op(a, b, (a, b) => a / b);

  // assert.equal(value(state => state.left)({}, {left: 1}, {}), 1);
  // assert.equal(value(state => state.left).store(0, 1), 1);
  // assert.equal(value(state => state.left).restore(0, 1), 1);
  // assert.equal(key('left')({}, {left: 1}, {}), 1);
  // assert.equal(key('left').px()({}, {left: 1}, {}), '1px');

  const concat = ary => {
    if (typeof ary === 'function') {
      return value((state, animated) => ary(state, animated).join(''));
    }
    else if (Array.isArray(ary)) {
      // let body = 'return ';
      // const fary = ary.map(value).map(f => f.value);
      // body += fary.map((_, i) => `ary[${i}](state, animated)`).join(' + ');
      // return value(new Function('ary, state, animated', body).bind(null, fary));
      const fary = ary.map(value);
      return value((state, animated) => {
        let s = '';
        for (let fn of fary) {
          s += fn.value(state, animated);
        }
        return s;
      });
    }
  };

  const func = name => ary => {
    if (typeof ary === 'function') {
      const cc = concat(state => [name, '('].concat(state.join(', '), ')'));
      return value((state, animated) => cc.value(ary(state, animated), animated));
    }
    else {
      return value(concat([name, '('].concat(ary.slice(1).reduce((carry, a) => carry.concat(', ', a), [ary[0]]), [')'])));
    }
  };

  const translate = func('translate');
  const translatex = func('translatex');
  const translatey = func('translatey');
  const translatez = func('translatez');
  const translate3d = func('translate3d');
  const rotate = func('rotate');
  const rotatex = func('rotatex');
  const rotatey = func('rotatey');
  const rotatez = func('rotatez');
  const rotate3d = func('rotate3d');
  const scale = func('scale');
  const scalex = func('scalex');
  const scaley = func('scaley');
  const scalez = func('scalez');
  const scale3d = func('scale3d');

  const against = (a, op, b) => value((state, animated) => op(a, b(a)).value(state, animated));

  const to = (a, b) => against(a, sub, b);
  const over = (a, b) => against(a, div, b);

  // assert.equal(concat(state => [state.left, ' ', state.top])({}, {left: 1, top: 2}, {}), '1 2');
  // assert.equal(concat([state => state.left, ' ', state => state.top])({}, {left: 1, top: 2}, {}), '1 2');
  // assert.equal(translate(state => [state.left, state.top])({}, {left: 1, top: 2}, {}), 'translate(1, 2)');
  // assert.equal(translate([state => state.left, state => state.top])({}, {left: 1, top: 2}, {}), 'translate(1, 2)');
  // assert.equal(translate([key('left'), key('top')])({}, {left: 1, top: 2}, {}), 'translate(1, 2)');
  // assert.equal(translate([key('left').px(), key('top').px()])({}, {left: 1, top: 2}, {}), 'translate(1px, 2px)');

  // const mapValues = entries => entries.map(([key, value]) => {
  //   if (value.value) {return [key, value.value]};
  //   return [key, value];
  // });
  const mapValues = entries => entries;

  // const px =

  const properties = o => {
    const entries = (Object.entries(o));
    // let body = '';
    // for (let [key, value] of entries) {
    //   if (value.value) {
    //     body += `element.${key} = values.${key}(element.${key}, state, animated);\n`;
    //   }
    //   else {
    //     body += `values.${key}(element.${key}, state, animated);\n`;
    //   }
    // }
    // body += 'return element;';
    // const f = new Function('values, element, state, animated', body).bind(null, o);
    const f = (element, state, animated) => {
      for (let [key, value] of entries) {
        if (value.value) {
          element[key] = value(element[key], state, animated);
        }
        else {
          value(element[key], state, animated);
        }
      }
      return element;
    };
    f.store = (state, element, animated) => {
      state = state || {};
      for (let [key, value] of entries) {
        state[key] = value.store(state[key], element[key], animated);
      }
      return state;
    };
    f.restore = (element, state, animated) => {
      for (let [key, value] of entries) {
        if (value.value) {
          element[key] = value.restore(element[key], state[key], animated);
        }
        else {
          value.restore(element[key], state[key], animated);
        }
      }
      return element;
    };
    return f;
  };

  const styles = o => properties({style: properties(o)});

  // assert.equal(properties({src: key('src')})({src: ''}, {src: 'abc'}, {}).src, 'abc');
  // assert.equal(properties({src: key('src')}).store({}, {src: 'abc'}).src, 'abc');
  // assert.equal(properties({src: key('src')}).restore({}, {src: 'abc'}, {}).src, 'abc');

  const elements = o => {
    const entries = (Object.entries(o));
    const f = (element, state, animated) => {
      for (let [key, value] of entries) {
        value(animated.animated.elements[key].element, state, animated);
      }
      return element;
    };
    f.store = (state, element, animated) => {
      state = state || {}
      for (let [key, value] of entries) {
        state[key] = value.store(state[key], animated.animated.elements[key].element, animated);
      }
      return state;
    };
    f.restore = (element, state, animated) => {
      for (let [key, value] of entries) {
        value.restore(animated.animated.elements[key].element, state[key], animated);
      }
      return element;
    };
    return f;
  };

  const object = o => {
    const entries = (Object.entries(o));
    const f = (element, state, animated) => {
      for (let [key, value] of entries) {
        value(element, state[key], animated);
      }
      return element;
    };
    f.store = (state, element, animated) => {
      for (let [key, value] of entries) {
        value.store(state, element, animated);
      }
      return state;
    };
    f.restore = (element, state, animated) => {
      for (let [key, value] of entries) {
        value.restore(element, state, animated);
      }
      return element;
    };
    return f;
  };

  // assert.equal(object({leg: properties({src: key('src')})})({}, {leg: {src: 'abc'}}, {}).src, 'abc');
  // assert.equal(object({leg: properties({src: key('src')})}).store({}, {src: 'abc'}, {}).src, 'abc');
  // assert.equal(object({leg: properties({src: key('src')})}).restore({}, {src: 'abc'}, {}).src, 'abc');

  return {
    add,
    begin,
    concat,
    constant,
    deg,
    div,
    divide,
    elements,
    em,
    end,
    func,
    key,
    mul,
    multiply,
    object,
    over,
    op,
    path,
    percent,
    properties,
    px,
    rad,
    rem,
    rotate,
    rotate3d,
    rotatex,
    rotatey,
    rotatez,
    scale,
    scale3d,
    scalex,
    scaley,
    scalez,
    styles,
    style: styles,
    sub,
    subtract,
    to,
    translate,
    translate3d,
    translatex,
    translatey,
    translatez,
    value,
    vh,
    vmax,
    vmin,
    vw,
  };
}).freeze();

export const add = present.add;
export const begin = present.begin;
export const concat = present.concat;
export const constant = present.constant;
export const deg = present.deg;
export const div = present.div;
export const divide = present.divide;
export const elements = present.elements;
export const em = present.em;
export const end = present.end;
export const func = present.func;
export const key = present.key;
export const mul = present.mul;
export const multiply = present.multiply;
export const object = present.object;
export const op = present.op;
export const path = present.path;
export const percent = present.percent;
export const properties = present.properties;
export const px = present.px;
export const rad = present.rad;
export const rem = present.rem;
export const rotate = present.rotate;
export const rotate3d = present.rotate3d;
export const rotatex = present.rotatex;
export const rotatey = present.rotatey;
export const rotatez = present.rotatez;
export const scale = present.scale;
export const scale3d = present.scale3d;
export const scalex = present.scalex;
export const scaley = present.scaley;
export const scalez = present.scalez;
export const styles = present.styles;
export const sub = present.sub;
export const subtract = present.subtract;
export const translate = present.translate;
export const translate3d = present.translate3d;
export const translatex = present.translatex;
export const translatey = present.translatey;
export const translatez = present.translatez;
export const value = present.value;
export const vh = present.vh;
export const vmax = present.vmax;
export const vmin = present.vmin;
export const vw = present.vw;

export default present;
