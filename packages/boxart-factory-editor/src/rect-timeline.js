import {h, Component} from 'preact';

import {Animation, AnimationBox as Box, AnimationProperty as Property, AnimationKeyframe as Keyframe} from 'boxart-factory';
import BoxAnimationTypes, {factory as BoxTypes_animation} from 'boxart-factory';
import BoxTypes from 'boxart-factory-preact';

const FORMAT = {
  TRANSITION: 'TRANSITION',
  ANIMATION: 'ANIMATION',
};

class KeyframeEdit extends Component {
  constructor(...args) {
    super(...args);

    this.changeValue = this.changeValue.bind(this);
    this.changeFormat = this.changeFormat.bind(this);
  }

  componentDidMount() {
    this.componentDidUpdate();
  }

  componentDidUpdate() {
    const cellHeight = this.base.parentNode.clientHeight;
    this.base.style.left = `${cellHeight}px`;
  }

  dropClicks() {
    event.stopPropagation();
    return false;
  }

  changeValue(event) {
    this.props.changeFrame(this.props.keyframe.time, {
      value: event.target.value,
    });
  }

  changeFormat(event) {
    this.props.changeFrame(this.props.keyframe.time, {
      format: event.target.checked ?
        event.target.value :
        event.target.value === FORMAT.TRANSITION ?
          FORMAT.ANIMATION :
          FORMAT.TRANSITION
    });
  }

  render({keyframe}) {
    return (
      <div
        onClick={this.dropClicks}
        style={{position: 'absolute', display: 'inline-block', background: 'rgba(255,255,255,0.8)', whiteSpace: 'nowrap', zIndex: 10}}>
        <label><input type="text" value={keyframe.value} onBlur={this.changeValue} /></label>
        <label title="transition"><input type="radio" checked={keyframe.format === FORMAT.TRANSITION} value={FORMAT.TRANSITION} onChange={this.changeFormat} />T</label>
        <label title="animation"><input type="radio" checked={keyframe.format === FORMAT.ANIMATION} value={FORMAT.ANIMATION} onChange={this.changeFormat} />A</label>
      </div>
    );
  }
}

class KeyframeItem extends Component {
  constructor(...args) {
    super(...args);

    this.selectFrame = this.selectFrame.bind(this);
    this.onDoubleClick = this.onDoubleClick.bind(this);
  }

  componentDidMount() {
    this.componentDidUpdate();
  }

  componentDidUpdate() {
    const position = this.props.keyframe.time;
    const cellHeight = this.base.clientHeight - 2;
    this.base.style.width = `${cellHeight + 2}px`;
    this.base.style.left = `${cellHeight * position}px`;
  }

  selectFrame(event) {
    this.props.setCursor(this.props.keyframe.time);
    this.props.selectFrame(this.props.keyframe.time);
    event.preventDefault();
    event.stopPropagation();
  }

  onDoubleClick(event) {
    this.props.removeFrame(this.props.keyframe.time);
    event.preventDefault();
    event.stopPropagation();
    return false;
  }

  render({cursor, selected}) {
    return (
      <div
        onDblClick={this.onDoubleClick}
        style={{position: 'absolute', background: 'black'}}>
        &nbsp;
        {selected ?
          <KeyframeEdit
            keyframe={this.props.keyframe}
            changeFrame={this.props.changeFrame} /> :
          null}
      </div>
    );
  }
}

class ValueBody extends Component {
  constructor(...args) {
    super(...args);

    this.onClick = this.onClick.bind(this);
    this.onDoubleClick = this.onDoubleClick.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.addFrame = this.addFrame.bind(this);
    this.changeFrame = this.changeFrame.bind(this);
    this.selectFrame = this.selectFrame.bind(this);
    this.removeFrame = this.removeFrame.bind(this);
  }

  getTime(event) {
    const height = event.target.clientHeight - 2;
    let x = event.offsetX / height | 0;
    if (event.target !== this.base) {
      x += event.target.offsetLeft / height | 0;
    }
    return x;
  }

  onClick(event) {
    const x = this.getTime(event);

    this.props.setCursor(x);

    event.preventDefault();
    event.stopPropagation();
    return false;
  }

  onDoubleClick(event) {
    if (this._pendingCursor === null) {
      return;
    }

    const height = event.target.clientHeight - 2;
    const x = event.offsetX / height | 0;

    this.addFrame(x);
    this.props.setCursor(x);
    this._pendingCursor = null;

    event.preventDefault();
    event.stopPropagation();
    return false;
  }

  onMouseDown(event) {
    if (event.target.tagName.toLowerCase() === 'input') {
      return;
    }

    const x = this.getTime(event);

    this.softSelectTime = x;

    event.preventDefault();
    event.stopPropagation();
    return false;
  }

  onMouseUp(event) {
    if (event.target.tagName.toLowerCase() === 'input') {
      return;
    }

    this.softSelectTime = null;

    const x = this.getTime(event);

    const wasFrame = this.props.value.keyframes.find(frame => frame.time === x);
    const _pendingCursor = this._pendingCursor = new Promise(resolve => setTimeout(resolve, 300))
    .then(() => {
      const isFrame = this.props.value.keyframes.find(frame => frame.time === x);
      if (this._pendingCursor === _pendingCursor && wasFrame === isFrame) {
        this.props.setCursor(x);
        this.selectFrame(x);
        this._pendingCursor = null;
      }
    });

    event.preventDefault();
    event.stopPropagation();
    return false;
  }

  onMouseMove(event) {
    if (event.target.tagName.toLowerCase() === 'input') {
      return;
    }

    const {softSelectTime} = this;
    const {selected, value: {keyframes}} = this.props;
    if (typeof softSelectTime !== 'number' || keyframes.every(frame => frame.time !== softSelectTime)) {
      return;
    }

    const x = this.getTime(event);

    if (x === softSelectTime) {
      return;
    }

    this.moveFrame(softSelectTime, x);
    this.softSelectTime = x;

    event.preventDefault();
    event.stopPropagation();
    return false;
  }

  addFrame(position) {
    this.props.addFrame(this.props.value.name, {
      time: position,
    });
  }

  moveFrame(time, newTime) {
    this.props.changeFrame(this.props.value.name, time, {
      time: newTime,
    });
  }

  changeFrame(time, frame) {
    this.props.changeFrame(this.props.value.name, time, frame);
  }

  selectFrame(time) {
    this.props.selectFrame(this.props.value.name, time);
  }

  removeFrame(time) {
    this.props.removeFrame(this.props.value.name, time);
  }

  render({cursor, selected}) {
    return (
      <div
        onDblClick={this.onDoubleClick}
        onMouseDown={this.onMouseDown}
        onMouseMove={this.onMouseMove}
        onMouseUp={this.onMouseUp}
        style={{
          background: `1px center url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><rect x="0" y="0" width="16" height="16" fill="rgba(128,128,128,0.5)" /><rect x="1" y="1" width="14" height="14" fill="%23eee" /></svg>')`,
        }}>
        {this.props.value.keyframes && this.props.value.keyframes.map(keyframe => (
          <KeyframeItem
            cursor={cursor}
            selected={typeof this.softSelectTime !== 'number' && selected && selected.time === keyframe.time ? selected : null}
            keyframe={keyframe}
            changeFrame={this.changeFrame}
            selectFrame={this.selectFrame}
            removeFrame={this.removeFrame}
            setCursor={this.props.setCursor} />
        ))}
        &nbsp;
      </div>
    );
  }
}

class ValueHeader extends Component {
  constructor(...args) {
    super(...args);

    this.onClick = this.onClick.bind(this);
    this.onDoubleClick = this.onDoubleClick.bind(this);
  }

  onClick(event) {
    this.props.selectProperty(this.props.value.name);
  }

  onDoubleClick(event) {
    this.props.removeProperty(this.props.value.name);
  }

  render({value: {name}, selected}) {
    return (
      <div style={{position: 'relative', background: selected && selected.property === name ? 'gray' : ''}} onClick={this.onClick} onDblClick={this.onDoubleClick}>
        <span>{name}&nbsp;</span>
      </div>
    );
  }
}

class BoxBody extends Component {
  constructor(...args) {
    super(...args);

    this.addFrame = this.addFrame.bind(this);
    this.changeFrame = this.changeFrame.bind(this);
    this.selectFrame = this.selectFrame.bind(this);
    this.removeFrame = this.removeFrame.bind(this);
  }

  addFrame(propertyName, frame) {
    const {rect} = this.props;
    const type = BoxTypes[rect.type] || BoxTypes.Box;
    if (
      type.rectTypes &&
      propertyName in type.rectTypes &&
      'default' in type.rectTypes[propertyName] &&
      !('value' in frame)
    ) {
      this.props.addFrame(this.props.animated.name, propertyName, Object.assign({
        value: type.rectTypes[propertyName].default(),
      }, frame));
    } else {
      this.props.addFrame(this.props.animated.name, propertyName, frame);
    }
  }

  changeFrame(propertyName, time, frame) {
    if ('value' in frame) {
      const {rect} = this.props;
      const type = BoxTypes[rect.type] || BoxTypes.Box;
      let value = frame.value;
      if (
        type.rectTypes &&
        propertyName in type.rectTypes
      ) {
        value = type.rectTypes[propertyName].filter(value);
      }
      if (['x', 'y', 'width', 'height'].includes(propertyName)) {
        value = Number(value);
      }
      this.props.changeFrame(this.props.animated.name, propertyName, time, Object.assign({}, frame, {
        value,
      }));
    } else {
      this.props.changeFrame(this.props.animated.name, propertyName, time, frame);
    }
  }

  selectFrame(propertyName, time) {
    this.props.selectFrame(this.props.animated.name, propertyName, time);
  }

  removeFrame(propertyName, time) {
    this.props.removeFrame(this.props.animated.name, propertyName, time);
  }

  render({cursor, rect, animated = [], selected}) {
    const type = BoxTypes[rect.type] || BoxTypes.Box;
    const valued = [
      {key: 'x'}, {key: 'y'}, {key: 'width'}, {key: 'height'},
      ...(Object.keys(type.rectTypes || {}).map(key => ({key})))
    ];
    return (
      <div style={{minWidth: '100%'}}>
        <div style={{
          minWidth: '100%',
          background: '#eee',
        }}>&nbsp;</div>
        {animated.properties && valued
          .map(value => animated.properties.find(property => value.key === property.name))
          .filter(Boolean)
          .map(animate => (
            <ValueBody
              cursor={cursor}
              selected={selected && selected.box === rect.name && selected.property === animate.name ? selected : null}
              value={animate}
              addFrame={this.addFrame} changeFrame={this.changeFrame} selectFrame={this.selectFrame} removeFrame={this.removeFrame}
              setCursor={this.props.setCursor} />
          ))}
        <div style={{
          minWidth: '100%',
          background: '#eee',
        }}>&nbsp;</div>
        <div style={{
          minWidth: '100%',
          background: '#eee',
        }}>&nbsp;</div>
      </div>
    );
  }
}

class BoxHeader extends Component {
  constructor(...args) {
    super(...args);

    this.setType = this.setType.bind(this);
    this.addProperty = this.addProperty.bind(this);
    this.selectProperty = this.selectProperty.bind(this);
    this.removeProperty = this.removeProperty.bind(this);
    this.selectBox = this.selectBox.bind(this);
  }

  setType(event) {
    this.props.setType(this.props.rect.name, event.target.value);
  }

  addProperty(event) {
    const rect = this.props.rect;
    event.target.value && this.props.addProperty(rect.name, event.target.value);
  }

  selectProperty(propertyName) {
    this.props.selectProperty(this.props.rect.name, propertyName);
  }

  removeProperty(propertyName) {
    this.props.removeProperty(this.props.rect.name, propertyName);
  }

  selectBox() {
    this.props.selectBox(this.props.rect.name);
  }

  render({rect, animated = [], selected}) {
    const type = BoxTypes[rect.type] || BoxTypes.Box;
    const valued = [
      {key: 'x'}, {key: 'y'}, {key: 'width'}, {key: 'height'},
      ...(Object.keys(type.rectTypes || {}).map(key => ({key})))
    ];

    return (
      <div>
        <div style={{position: 'relative', background: selected && selected.box === this.props.rect.name && !selected.property ? 'gray' : ''}} onClick={this.selectBox}>
          <span>{rect.name || 'root'}</span>
        </div>
        {animated.properties && valued
          .map(value => animated.properties.find(property => value.key === property.name))
          .filter(Boolean)
          .map(animate => <ValueHeader value={animate} selected={selected && selected.box === this.props.rect.name ? selected : null} selectProperty={this.selectProperty} removeProperty={this.removeProperty} />)}
        <div style={{overflow: 'hidden'}}>
          <span>&nbsp;</span>
          <select style={{height: '0'}} onChange={this.addProperty}>
            <option>-----</option>
            {valued.map(value => <option value={value.key}>{value.key}</option>)}
          </select>
          &nbsp;
        </div>
        <div style={{overflow: 'hidden'}}>
          <span>&nbsp;</span>
          <select style={{height: '0'}} onChange={this.setType}>
            <option>-----</option>
            {Object.keys(BoxAnimationTypes).map(key => <option selected={key === animated.type} value={key}>{key}</option>)}
          </select>
          &nbsp;
        </div>
      </div>
    );
  }
}

class KeyframeBody extends Component {
  constructor(...args) {
    super(...args);

    this.selectKey = this.selectKey.bind(this);
  }

  selectKey(event) {
    const height = event.target.clientHeight - 2;
    const x = event.offsetX / height | 0;

    this.props.setCursor(x);
  }

  render() {
    return (
      <div style={{}}>
        <div>&nbsp;</div>
        <div
          onClick={this.selectKey}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            // width: '100%',
            background: `1px center url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><rect x="0" y="0" width="16" height="16" fill="rgba(128,128,128,0.5)" /><rect x="1" y="1" width="14" height="14" fill="%23eee" /></svg>')`,
          }}>
          &nbsp;
        </div>
      </div>
    );
  }
}

class AnimationOptions extends Component {
  constructor(...args) {
    super(...args);

    this.changeDuration = this.changeDuration.bind(this);
  }

  changeDuration(event) {
    this.props.changeDuration(Number(event.target.value));
  }

  render({meta}) {
    return (
      <div style={{background: 'white'}}>
        <div><label>duration<input
          type="text" value={meta.animation && meta.animation.duration}
          onChange={this.changeDuration} />
        </label></div>
        <div><label><input type="radio" name="transitionSetState" /><input type="checkbox" checked="" disabled="true" />transition start</label></div>
        <div><label><input type="radio" name="transitionSetState" /><input type="checkbox" checked="" disabled="true" />transition stop</label></div>
        <div><label><input type="radio" name="transitionSetState" />preview</label></div>
      </div>
    );
  }
}

class AnimationOptionsToggle extends Component {
  constructor(...args) {
    super(...args);

    this.toggleOptions = this.toggleOptions.bind(this);
  }

  toggleOptions() {
    this.props.toggleOptions();
  }

  render({showOptions, meta, changeDuration}) {
    return (
      <span style={{position: 'absolute', right: 0}}>
        <div style={{textAlign: 'right'}} onClick={this.toggleOptions}>
          []
        </div>
        {showOptions ? <AnimationOptions meta={meta} changeDuration={changeDuration} /> : null}
      </span>
    );
  }
}

class KeyframeHeader extends Component {
  constructor(...args) {
    super(...args);

    this.selectAnimation = this.selectAnimation.bind(this);
    this.previewAnimation = this.previewAnimation.bind(this);
  }

  selectAnimation() {
    this.props.selectAnimation();
  }

  previewAnimation(event) {
    this.props.previewAnimation();
    event.stopPropagation();
    return false;
  }

  render({meta, selected, toggleOptions, changeDuration}) {
    return (
      <div style={{background: selected && typeof selected.box === 'undefined' ? 'gray' : ''}} onClick={this.selectAnimation}>
        <div>&nbsp;</div>
        <div style={{position: 'fixed', top: 0, left: 0, right: '86.6%', zIndex: 10}}>
          <div style={{position: 'absolute', right: '1em'}} onClick={this.previewAnimation}>{meta.state === TIMELINE_PREVIEW ? <span>&#x25b6;</span> : <span>&#x25b7;</span>}</div>
          <AnimationOptionsToggle meta={meta} showOptions={meta.showOptions} toggleOptions={toggleOptions} changeDuration={changeDuration} />
        </div>
      </div>
    );
  }
}

class Duration extends Component {
  componentDidMount() {
    this.componentDidUpdate();
  }

  componentDidUpdate() {
    const cellHeight = this.base.parentNode.children[2].clientHeight - 2;
    this.base.style.width = `${cellHeight * this.props.duration + 2}px`;
  }

  render() {
    return (
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        background: `#666`,
        zIndex: -1,
      }}>&nbsp;</div>
    );
  }
}

class Cursor extends Component {
  componentDidMount() {
    this.componentDidUpdate();
  }

  componentDidUpdate() {
    const cellHeight = this.base.parentNode.children[2].clientHeight - 2;
    this.base.style.width = `${cellHeight + 2}px`;
    this.base.style.left = `${cellHeight * this.props.cursor}px`;
  }

  render() {
    return (
      <div style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        background: `#000`,
        zIndex: -1,
      }} />
    );
  }
}

const TIMELINE_NEUTRAL = 'TIMELINE_NEUTRAL';
const TIMELINE_SET_BEGIN = 'TIMELINE_SET_BEGIN';
const TIMELINE_SET_END = 'TIMELINE_SET_END';
const TIMELINE_ANIMATE = 'TIMELINE_ANIMATE';
const TIMELINE_ANIMATE_KEY = 'TIMELINE_SELECT_ANIMATE_KEY';
const TIMELINE_MOVE_FRAME = 'TIMELINE_MOVE_FRAME';
const TIMELINE_CLIPBOARD = 'TIMELINE_CLIPBOARD';
const TIMELINE_SELECT_ANIMATION = 'TIMELINE_SELECT_ANIMATION';
const TIMELINE_SELECT_BOX = 'TIMELINE_SELECT_BOX';
const TIMELINE_SELECT_PROPERTY = 'TIMELINE_SELECT_PROPERTY';
const TIMELINE_SELECT_KEYFRAME = 'TIMELINE_SELECT_ANIMATE_KEY';
const TIMELINE_PREVIEW = 'TIMELINE_PREVIEW";"'

class Timeline extends Component {
  constructor(...args) {
    super(...args);

    this.state = {
      state: TIMELINE_NEUTRAL,
      compareTo: null,
    };

    this.setCursor = this.setCursor.bind(this);
    this.setDuration = this.setDuration.bind(this);
    this.toggleOptions = this.toggleOptions.bind(this);
    this.selectAnimation = this.selectAnimation.bind(this);
    this.previewAnimation = this.previewAnimation.bind(this);
    this.selectBox = this.selectBox.bind(this);
    this.setType = this.setType.bind(this);
    this.addProperty = this.addProperty.bind(this);
    this.selectProperty = this.selectProperty.bind(this);
    this.removeProperty = this.removeProperty.bind(this);
    this.addFrame = this.addFrame.bind(this);
    this.changeFrame = this.changeFrame.bind(this);
    this.selectFrame = this.selectFrame.bind(this);
    this.removeFrame = this.removeFrame.bind(this);
  }

  async componentDidMount() {
    if (localStorage.lastAnimation) {
      try {
        await new Promise(resolve => setTimeout(resolve, 50));
        // this.props.setEditorMeta('timeline', {
        //   animation: Animation.fromJson(JSON.parse(localStorage.lastAnimation)),
        // });
      }
      catch (e) {
        console.error('Failed to load prior animation data', e.stack || e.message || e);
      }
    }

    document.addEventListener('cut', event => {
      if (event.target.tagName.toLowerCase() === 'input') {
        return;
      }
      if (!this.props.meta.select) {
        return;
      }
      event.clipboardData.setData('text/plain', JSON.stringify(this.getSelect()));
      this.resetSelect();
      event.preventDefault();
    });
    document.addEventListener('copy', event => {
      if (event.target.tagName.toLowerCase() === 'input') {
        return;
      }
      if (!this.props.meta.select) {
        return;
      }
      event.clipboardData.setData('text/plain', JSON.stringify(this.getSelect()));
      event.preventDefault();
    });
    document.addEventListener('paste', event => {
      if (event.target.tagName.toLowerCase() === 'input') {
        return;
      }
      if (!this.props.meta.select) {
        return;
      }
      this.setSelect(JSON.parse(event.clipboardData.getData('text/plain')));
      event.preventDefault();
    });
  }

  componentWillReceiveProps(props) {
    switch (this.props.meta.state) {
    case void 0:
    case TIMELINE_NEUTRAL:
      if (props.meta.animation === void 0) {
        this.props.setEditorMeta('timeline', {
          // beginRect: props.rect,
          // endRect: props.rect,
          animation: new Animation(),
          showOptions: false,
        });
      }
      break;
    case TIMELINE_ANIMATE:
      // if (props.meta.state === 'TIMELINE_SET_BEGIN') {
      //   this.props.updateRect(this.props.meta.beginRect);
      // }
      // if (props.meta.state === 'TIMELINE_SET_END') {
      //   this.props.updateRect(this.props.meta.endRect);
      // }
      break;
    case TIMELINE_ANIMATE_KEY:
      // if (props.meta.state === 'TIMELINE_SET_BEGIN') {
      //   this.props.updateRect(this.props.meta.beginRect);
      //   break;
      // }
      // if (props.meta.state === 'TIMELINE_SET_END') {
      //   this.props.updateRect(this.props.meta.endRect);
      //   break;
      // }

      // if past current duration, set new duration and lastRect

      // rects that changed
      // changed rects with names
      // create or update frames
      // updateAnimation({...})
      break;
    }
  }

  async componentDidUpdate() {
    localStorage.lastAnimation = JSON.stringify(this.props.meta.animation);

    if (this.props.meta.state === TIMELINE_ANIMATE_KEY || this.props.meta.state === TIMELINE_PREVIEW) {
      await Promise.resolve();
      if (this.animation) {
        return;
      }
      const animation = this.animation = BoxTypes_animation(this.props.meta.animation);
      const data = this.data = {
        animated: {
          root: {
            element: document.getElementsByClassName('root').length &&
              document.getElementsByClassName('root')[0] ||
              document.getElementById('editRegion').children[0],
          },
        },
        store: null,
        state: null,
        begin: null,
        end: null,
      };
      data.end = animation.update(data.end || {}, data.animated.root.element, data);
      data.begin = animation.update.copy(data.begin || {}, data.end);
      data.state = animation.update.copy(data.state || {}, data.end);
      data.state = animation.animate(this.props.meta.cursor / 30, data.state || {}, data.begin, data.end, data);
      data.store = animation.present.store(data.store || {}, data.animated.root.element, data);
      animation.present(data.animated.root.element, data.state, data);

      await new Promise(resolve => setTimeout(resolve, 1000 / 30));

      if (this.props.meta.state === TIMELINE_PREVIEW && this.animation === animation) {
        const {animation, cursor} = this.props.meta;
        this.props.setEditorMeta('timeline', {
          cursor: isNaN(cursor) || cursor >= animation.duration - 1 ? 0 : cursor + 1,
        });
      }
    } else {
      this.animation = null;
      this.data = null;
    }
  }

  componentWillUpdate() {
    if (this.animation) {
      const animation = this.animation;
      const data = this.data;
      animation.present.restore(data.animated.root.element, data.store || {}, data);
      this.animation = null;
      this.data = null;
    }
  }

  setCursor(x) {
    if (!this.props.meta.animation || x > this.props.meta.animation.duration) {
      return;
    }
    if (this.props.meta.state !== TIMELINE_ANIMATE_KEY) {
      this.props.setEditorMeta('timeline', {
        state: TIMELINE_ANIMATE_KEY,
        cursor: x,
        select: null,
      });
    }
    else if (this.props.meta.cursor !== x) {
      this.props.setEditorMeta('timeline', {
        cursor: x,
        select: null,
      });
    }
    else {
      this.props.setEditorMeta('timeline', {
        state: TIMELINE_ANIMATE,
        select: null,
      });
    }
  }

  setDuration(duration) {
    this.props.setEditorMeta('timeline', {
      animation: this._getAnimation().assign({
        duration,
      }),
    });
  }

  toggleOptions() {
    this.props.setEditorMeta('timeline', {
      showOptions: !this.props.meta.showOptions,
    });
  }

  _getAnimation() {
    return this.props.meta.animation || new Animation();
  }

  selectAnimation() {
    if (
      this.props.meta.state === TIMELINE_SELECT_ANIMATION
    ) {
      return this.props.setEditorMeta('timeline', {
        state: TIMELINE_ANIMATE,
        select: null,
      });
    }

    this.props.setEditorMeta('timeline', {
      state: TIMELINE_SELECT_ANIMATION,
      select: {},
    });
  }

  previewAnimation() {
    if (this.props.meta.state === TIMELINE_PREVIEW) {
      return this.props.setEditorMeta('timeline', {
        state: TIMELINE_ANIMATE,
      });
    }

    this.props.setEditorMeta('timeline', {
      state: TIMELINE_PREVIEW,
    });
  }

  selectBox(boxName) {
    if (
      this.props.meta.state === TIMELINE_SELECT_BOX &&
      this.props.meta.select.box === boxName
    ) {
      return this.props.setEditorMeta('timeline', {
        state: TIMELINE_ANIMATE,
        select: null,
      });
    }

    this.props.setEditorMeta('timeline', {
      state: TIMELINE_SELECT_BOX,
      select: {
        box: boxName,
      },
    });
  }

  setType(boxName, typeName) {
    this.props.setEditorMeta('timeline', {
      animation: this._getAnimation().setType(boxName, typeName)
    });
  }

  addProperty(boxName, propertyName) {
    this.props.setEditorMeta('timeline', {
      animation: this._getAnimation().addProperty(boxName, propertyName)
    });
  }

  selectProperty(boxName, propertyName) {
    if (
      this.props.meta.state === TIMELINE_SELECT_PROPERTY &&
      this.props.meta.select.box === boxName &&
      this.props.meta.select.property === propertyName
    ) {
      return this.props.setEditorMeta('timeline', {
        state: TIMELINE_ANIMATE,
        select: null,
      });
    }

    this.props.setEditorMeta('timeline', {
      state: TIMELINE_SELECT_PROPERTY,
      select: {
        box: boxName,
        property: propertyName,
      },
    });
  }

  removeProperty(boxName, propertyName) {
    this.props.setEditorMeta('timeline', {
      animation: this._getAnimation().removeProperty(boxName, propertyName)
    });
  }

  addFrame(boxName, propertyName, frame) {
    this.props.setEditorMeta('timeline', {
      animation: this._getAnimation().addFrame(boxName, propertyName, frame)
    });
  }

  changeFrame(boxName, propertyName, time, frame) {
    this.props.setEditorMeta('timeline', {
      animation: this._getAnimation().changeFrame(boxName, propertyName, time, frame)
    });
  }

  selectFrame(boxName, propertyName, time) {
    if (
      this.props.meta.state === TIMELINE_SELECT_KEYFRAME &&
      this.props.meta.select &&
      this.props.meta.select.box === boxName &&
      this.props.meta.select.property === propertyName &&
      this.props.meta.select.time === time
    ) {
      return this.props.setEditorMeta('timeline', {
        state: TIMELINE_ANIMATE,
        select: null,
      });
    }

    this.props.setEditorMeta('timeline', {
      state: TIMELINE_SELECT_KEYFRAME,
      select: {
        box: boxName,
        property: propertyName,
        time,
      },
    });
  }

  removeFrame(boxName, propertyName, time) {
    this.props.setEditorMeta('timeline', {
      animation: this._getAnimation().removeFrame(boxName, propertyName, time)
    });
  }

  getSelect() {
    const {select, animation} = this.props.meta;
    if (typeof select.box !== 'undefined') {
      if (select.property) {
        if (typeof select.time !== 'undefined') {
          return animation._findBox(select.box)._findProperty(select.property)._findFrame(select.time);
        }
        return animation._findBox(select.box)._findProperty(select.property);
      }
      return animation._findBox(select.box);
    }
    return animation;
  }

  setSelect(value) {
    const {select, animation} = this.props.meta;
    if (typeof select.box !== 'undefined') {
      if (select.property) {
        if (typeof select.time !== 'undefined') {
          return this.props.setEditorMeta('timeline', {
            animation: animation._changeBoxes(
              select.box,
              animation._findBox(select.box)._changeProperties(
                select.property,
                animation._findBox(select.box)._findProperty(select.property)._changeKeyframes(
                  select.time,
                  Keyframe.fromJson({}, value, {time: select.time})
                )
              )
            ),
          });
        }
        return this.props.setEditorMeta('timeline', {
          animation: animation._changeBoxes(
            select.box,
            animation._findBox(select.box)._changeProperties(
              select.property,
              Property.fromJson(Object.assign({}, value, {name: select.property}))
            )
          ),
        });
      }
      return this.props.setEditorMeta('timeline', {
        animation: animation._changeBoxes(select.box, Box.fromJson(Object.assign({}, value, {name: select.box}))),
      });
    }
    return this.props.setEditorMeta('timeline', {
      animation: Animation.fromJson(value),
    });
  }

  resetSelect() {
    const {select, animation} = this.props.meta;
    if (typeof select.box !== 'undefined') {
      if (select.property) {
        if (typeof select.time !== 'undefined') {
          return this.props.setEditorMeta('timeline', {
            animation: animation._changeBoxes(
              select.box,
              animation._findBox(select.box)._changeProperties(
                select.property,
                animation._findBox(select.box)._findProperty(select.property)._changeKeyframes(
                  select.time,
                  null
                )
              )
            ),
          });
        }
        return this.props.setEditorMeta('timeline', {
          animation: animation._changeBoxes(
            select.box,
            animation._findBox(select.box)._changeProperties(
              select.property,
              null
            )
          ),
        });
      }
      return this.props.setEditorMeta('timeline', {
        animation: animation._changeBoxes(select.box, null),
      });
    }
    return this.props.setEditorMeta('timeline', {
      animation: new Animation(),
    });
  }

  render({rect, meta, setEditorMeta}) {
    const walk = function*(rects) {
      for (const rect of rects) {
        if (rect.name) {
          yield rect;
        }
        yield* walk(rect.children);
      }
    };

    const named = [...walk([rect])];
    if (named[0] !== rect) {
      named.unshift(rect);
    }

    const toggleBegin = () => {
      this.props.setEditorMeta('timeline', {
        state: this.props.meta.state !== TIMELINE_SET_BEGIN ? TIMELINE_SET_BEGIN : TIMELINE_ANIMATE,
      });
    };
    const toggleEnd = () => {
      this.props.setEditorMeta('timeline', {
        state: this.props.meta.state !== TIMELINE_SET_END ? TIMELINE_SET_END : TIMELINE_ANIMATE,
      });
    };

    const {animation = {boxes: []}} = meta || {};

    return (
      <div style={{position: 'relative', height: '100%', overflow: 'scroll'}}>
        <div style={{position: 'absolute', top: 0, left: 0, right: '80%', overflowY: 'scroll', overflowX: 'hidden'}}>
          <KeyframeHeader meta={meta}
            selected={meta.state && meta.state.indexOf('_SELECT_') >= 0 ? meta.select : null}
            toggleOptions={this.toggleOptions}
            selectAnimation={this.selectAnimation}
            previewAnimation={this.previewAnimation}
            changeDuration={this.setDuration} />
          {named.map(named => (
            <BoxHeader
              rect={named}
              selected={meta.state && meta.state.indexOf('_SELECT_') >= 0 ? meta.select : null}
              animated={animation.boxes.find(box => box.name === named.name)}
              selectBox={this.selectBox}
              setType={this.setType}
              addProperty={this.addProperty}
              selectProperty={this.selectProperty}
              removeProperty={this.removeProperty} />
          ))}
        </div>
        <div style={{position: 'absolute', top: 0, left: '20%', minWidth: '80%', overflow: 'scroll'}}>
          {(meta.state !== void 0 || meta.state !== TIMELINE_NEUTRAL) ? <Duration duration={meta.animation ? meta.animation.duration : 30} /> : <Duration duration={30} />}
          {(meta.state === TIMELINE_ANIMATE_KEY || meta.state === TIMELINE_PREVIEW) ? <Cursor cursor={meta.cursor} /> : <Cursor cursor={-1} />}
          <KeyframeBody setCursor={this.setCursor} />
          {named.map(named => (
            <BoxBody
              cursor={meta.state === TIMELINE_ANIMATE_KEY ? meta.cursor : -1}
              selected={meta.state && meta.state.indexOf('_SELECT_') >= 0 ? meta.select : null}
              rect={named}
              animated={animation.boxes.find(box => box.name === named.name)}
              addFrame={this.addFrame}
              changeFrame={this.changeFrame}
              selectFrame={this.selectFrame}
              removeFrame={this.removeFrame}
              setCursor={this.setCursor} />
          ))}
        </div>
      </div>
    )
  }
}

export default Timeline;
