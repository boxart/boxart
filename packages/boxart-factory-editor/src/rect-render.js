import {h, Component} from 'preact';

import {Rect} from 'boxart-factory';

const BoxTypes = require('boxart-factory-preact').default;

const RECT_STATE = {
  INIT: 'INIT',
  DOUBLE_PRESS: 'DOUBLE_PRESS',
  DOWN: 'PRESS',
  DRAG: 'DRAG',
  ADD: 'ADD',
};

class RectState {
  constructor() {
    this.state = RECT_STATE.INIT;
    this.position = null;
  }

  assert(mustBe) {
    if (this.state !== mustBe) {
      throw new Error(`must be in ${mustBe} state`);
    }
  }

  _add(position) {
    this.state = RECT_STATE.ADD;
    this.position = position;
  }

  downToAdd(position) {
    this.assert(RECT_STATE.DOWN);
    this._add(position);
  }

  doublePressToAdd(position) {
    this.assert(RECT_STATE.DOUBLE_PRESS);
    this._add(position);
  }

  downToDoublePress(position) {
    this.assert(RECT_STATE.DOWN);
    this.state = RECT_STATE.DOUBLE_PRESS;
    this.position = position;
  }

  initToDown(position) {
    this.assert(RECT_STATE.INIT);
    this.state = RECT_STATE.DOWN;
    this.position = position;
  }

  _drag(position) {
    this.state = RECT_STATE.DRAG;
    this.position = position;
  }

  downToDrag(position) {
    this.assert(RECT_STATE.DOWN);
    this._drag(position);
  }

  doublePressToDrag(position) {
    this.assert(RECT_STATE.DOUBLE_PRESS);
    this._drag(position);
  }

  _init() {
    this.state = RECT_STATE.INIT;
    this.position = null;
  }

  downToInit() {
    this.assert(RECT_STATE.DOWN);
    this._init();
  }

  doublePressToInit() {
    this.assert(RECT_STATE.DOUBLE_PRESS);
    this._init();
  }

  dragToInit() {
    this.assert(RECT_STATE.DRAG);
    this._init();
  }

  addToInit() {
    this.assert(RECT_STATE.ADD);
    this._init();
  }

  is(state) {
    return this.state === state;
  }

  isAdd() {
    return this.is(RECT_STATE.ADD);
  }

  isDoublePress() {
    return this.is(RECT_STATE.DOUBLE_PRESS);
  }

  isDown() {
    return this.is(RECT_STATE.DOWN);
  }

  isDrag() {
    return this.is(RECT_STATE.DRAG);
  }

  isInit() {
    return this.is(RECT_STATE.INIT);
  }
}

// const colors = ['ffb5e8', 'b28dff', 'dcd3ff', 'aff8db', 'bffcc6', 'ffc9de'];

const colorChances = 'ffb5e8b2dcd3ac69'.split('');
const c1 = () => colorChances[Math.random() * colorChances.length  | 0];
const colors =
  colorChances.map(l => `${l}${c1()}${c1()}${c1()}${c1()}${c1()}`)
  .concat(colorChances.map(l => `${l}${c1()}${c1()}${c1()}${c1()}${c1()}`))
  .concat(colorChances.map(l => `${l}${c1()}${c1()}${c1()}${c1()}${c1()}`));

class RectRender extends Component {
  constructor(...args) {
    super(...args);

    this.timeouts = null;
    this.state = new RectState();
    this.color = colors[Math.random() * colors.length | 0];

    this.addChild = this.addChild.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseHeld = this.onMouseHeld.bind(this);
    this.onMouseLeave = this.onMouseLeave.bind(this);
    this.onMouseOnePress = this.onMouseOnePress.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.removeChild = this.removeChild.bind(this);
    this.updateChild = this.updateChild.bind(this);
  }

  static offsetPosition(_this, event) {
    // debugger;
    return {
      x: (event.clientX - RectRender.divLeft(event.target.offsetParent)) / event.target.offsetParent.clientWidth,
      y: (event.clientY - RectRender.divTop(event.target.offsetParent)) / event.target.offsetParent.clientHeight,
    };
  }

  static position(_this, event) {
    // debugger;
    return {
      x: (event.clientX - RectRender.divLeft(event.target)) / event.target.clientWidth,
      y: (event.clientY - RectRender.divTop(event.target)) / event.target.clientHeight,
    };
  }

  static divLeft(base) {
    let left = 0;
    while (base !== document.body) {
      left += base.offsetLeft;
      base = base.offsetParent;
    }
    return left;
  }

  static divTop(base) {
    let top = 0;
    while (base !== document.body) {
      top += base.offsetTop;
      base = base.offsetParent;
    }
    return top;
  }

  static divPosition(base) {
    return {
      x: RectRender.divLeft(base),
      y: RectRender.divTop(base),
    };
  }

  addChild(child) {
    this.props.updateChild(this.props.rect.addChild(child));
  }

  clearTimeout(fn) {
    if (this.timeouts === null) {
      this.timeouts = new WeakMap();
    }

    clearTimeout(this.timeouts.get(fn));
  }

  onMouseDown(event) {
    if (event.currentTarget !== this.base) {
      return;
    }

    if (this.state.isInit()) {
      this.state.initToDown(RectRender.offsetPosition(this, event));
    }
    else if (this.state.isDown()) {
      this.clearTimeout(this.onMouseOnePress);
      // this.setTimeout(this.onMouseHeld, 300);
      this.state.downToDoublePress(RectRender.position(this, event));
    }
    this.props.selectRect();

    event.preventDefault();
    event.stopPropagation();
    return true;
  }

  onMouseHeld() {
    const {x: lx, y: ly} = this.state.position;
    const {clientWidth: bw, clientHeight: bh} = this.base;
    const {clientWidth: ow, clientHeight: oh} = this.base.offsetParent;
    const position = {
      x: (lx * ow) / bw,
      y: (ly * oh) / bh,
    }; 
    if (this.state.isDown()) {
      this.state.downToAdd(position);
    }
    else {
      this.state.doublePressToAdd(position);
    }
    this.props.updateChild(this.props.rect);
  }

  onMouseMove(event) {
    if (this.state.isInit()) {
      return;
    }

    if (event.currentTarget !== this.base) {
      return;
    }

    if (this.state.isDown()) {
      this.state.downToDrag(this.state.position);
      // this.clearTimeout(this.onMouseHeld);
    }
    else if (this.state.isDoublePress()) {
      this.state.doublePressToAdd(this.state.position);
      this.props.updateChild(this.props.rect);
    }

    if (this.state.isDrag()) {
      const position = RectRender.offsetPosition(this, event);
      this.props.updateChild(this.props.rect.assign({
        x: this.props.rect.x + position.x - this.state.position.x,
        y: this.props.rect.y + position.y - this.state.position.y,
      }));
      this.state._drag(position);
    }
    else if (this.state.isAdd()) {}

    event.preventDefault();
    event.stopPropagation();
    return true;
  }

  onMouseOnePress(event) {
    // this.clearTimeout(this.onMouseHeld);
    this.state.downToInit();
  }

  onMouseLeave(event) {
    this.onMouseUp(event);
  }

  onMouseUp(event) {
    if (event.currentTarget !== this.base) {
      return;
    }

    if (this.state.isInit()) {
      return;
    }

    if (this.state.isDown()) {
      this.clearTimeout(this.onMouseHeld);
      this.setTimeout(this.onMouseOnePress, 200);

      event.preventDefault();
      event.stopPropagation();
      return true;
    }
    else if (this.state.isDoublePress()) {
      this.clearTimeout(this.onMouseHeld);

      this.props.removeChild();
      this.state.doublePressToInit();
    }
    else if (this.state.isAdd()) {
      const position = RectRender.position(this, event);
      if (
        position.x !== this.state.position.x &&
        position.y !== this.state.position.y
      ) {
        const {x, y} = position;
        const {x: lx, y: ly} = this.state.position;

        this.addChild(new Rect({
          x: (lx + x) / 2,
          y: (ly + y) / 2,
          width: Math.max(lx, x) - Math.min(lx, x),
          height: Math.max(ly, y) - Math.min(ly, y),
        }));
      }
      this.state.addToInit();
    }
    else if (this.state.isDrag()) {
      this.state.dragToInit();
    }

    this.clearTimeout(this.onMouseHeld);

    event.preventDefault();
    event.stopPropagation();
    return true;
  }

  removeChild(index) {
    this.props.updateChild(this.props.rect.removeChild(index));
  }

  render() {
    const {rect, selectRect} = this.props;
    const {onMouseDown, onMouseUp, onMouseMove, onMouseLeave, removeChild, updateChild} = this;
    class Shadow extends Component {
      render({rect, index}) {
        return (
          <RectRender
            rect={rect}
            index={index}
            selectRect={selectRect.bind(null, index)}
            updateChild={updateChild.bind(null, index)}
            removeChild={removeChild.bind(null, index)}
            />
        );
      }
    }
    const Box = RectRender.types[rect.type || 'Box'];
    return (
      <Box
        rect={rect}
        // Shadow={Shadow}
        dom={{
          style: {
            cursor: this.state.isDrag() ? 'grabbing' : this.state.isAdd() ? 'crosshair' : '',
            background: `#${this.color}`,
          },
          onMouseDown: onMouseDown,
          onMouseUp: onMouseUp,
          onMouseMove: onMouseMove,
          onMouseLeave: onMouseLeave,
        }}>
        {rect.children.map((child, index) => (
          <RectRender key={index} rect={child} index={index}
            selectRect={selectRect.bind(null, index)}
            updateChild={updateChild.bind(null, index)}
            removeChild={removeChild.bind(null, index)}
            />
        ))}
      </Box>
    );
  }

  updateChild(index, child) {
    this.props.updateChild(this.props.rect.updateChild(index, child));
  }

  setTimeout(fn, timeout) {
    this.clearTimeout(fn);
    this.timeouts.set(fn, setTimeout(fn, timeout));
  }
}

RectRender.types = BoxTypes;

export default RectRender;
