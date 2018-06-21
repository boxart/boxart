import {h, Component} from 'preact';

import {Animation, Rect} from 'boxart-factory';

import RectRender from './rect-render';
import RectValues from './rect-values';
import RectHierarchy from './rect-hierarchy';
import RectTimeline from './rect-timeline';

const noop = () => {};

class RectEditor extends Component {
  constructor() {
    super();

    this.state = {
      pasteMode: 'paste',
      rect: Rect.fromJson(JSON.parse(localStorage.lastRect || JSON.stringify(new Rect()))),
      path: [],
      meta: {
        animation: Animation.fromJson(JSON.parse(localStorage.lastAnimation || JSON.stringify(new Animation()))),
      },
    };

    this.updateChild = this.updateChild.bind(this);
    this.changePasteMode = this.changePasteMode.bind(this);
    this.resetRect = this.resetRect.bind(this);
    this.selectRect = this.selectRect.bind(this);
    this.updateSelect = this.updateSelect.bind(this);
    this.setEditorMeta = this.setEditorMeta.bind(this);
  }

  componentDidMount() {
    document.addEventListener('cut', event => {
      if (event.target.tagName.toLowerCase() === 'input') {
        return;
      }
      if (this.state.meta && this.state.meta.select) {
        return;
      }
      event.clipboardData.setData('text/plain', JSON.stringify(this.getRect(this.state.path)));
      if (this.state.path.length > 0) {
        this.removeSelect();
      }
      else {
        this.resetRect();
      }
      event.preventDefault();
    });
    document.addEventListener('copy', event => {
      if (event.target.tagName.toLowerCase() === 'input') {
        return;
      }
      if (this.state.meta && this.state.meta.select) {
        return;
      }
      event.clipboardData.setData('text/plain', JSON.stringify(this.getRect(this.state.path)));
      event.preventDefault();
    });
    document.addEventListener('paste', event => {
      if (event.target.tagName.toLowerCase() === 'input') {
        return;
      }
      if (this.state.meta && this.state.meta.select) {
        return;
      }
      if (this.state.pasteMode === 'paste') {
        this.addSelect(Rect.fromJson(JSON.parse(event.clipboardData.getData('text/plain'))));
      }
      else {
        this.updateSelect(Rect.fromJson(JSON.parse(event.clipboardData.getData('text/plain'))));
      }
      event.preventDefault();
    });
    window.addEventListener('keyup', event => {
      if (event.key.toLowerCase() === 'z') {
        if (event.shiftKey) {
          this.redo();
        }
        else {
          this.undo();
        }
        event.preventDefault();
      }
    });
  }

  componentDidUpdate() {
    localStorage.lastRect = JSON.stringify(this.state.rect);
  }

  getRect(path) {
    let rect = this.state.rect;
    for (let i = 0; i < path.length; i++) {
      if (rect.children.length <= path[i]) {
        break;
      }
      rect = rect.children[path[i]];
    }
    return rect;
  }

  doState(action, state) {
    this.setState(Object.assign({}, state, {
      action,
      undo: Object.assign({}, this.state),
      redo: null,
    }));
  }

  undo() {
    if (this.state.undo) {
      this.setState(Object.assign({}, this.state.undo, {
        redo: Object.assign({}, this.state),
        path: this.state.path,
        pasteMode: this.state.pasteMode,
        meta: Object.assign({}, this.state.undo.meta, {
          state: this.state.undo.state,
          cursor: this.state.undo.cursor,
          select: this.state.undo.select,
        }),
      }));
    }
  }

  redo() {
    if (this.state.redo) {
      this.setState(Object.assign({}, this.state.redo, {
        path: this.state.path,
        pasteMode: this.state.pasteMode,
        meta: Object.assign({}, this.state.undo.meta, {
          state: this.state.undo.state,
          cursor: this.state.undo.cursor,
          select: this.state.undo.select,
        }),
      }));
    }
  }

  resetRect() {
    this.doState('reset', {
      rect: new Rect(),
    });
  }

  changePasteMode() {
    this.setState({
      pasteMode: this.state.pasteMode === 'paste' ? 'overwrite' : 'paste',
    });
  }

  selectRect(...path) {
    this.setState({
      path,
    });
  }

  updateChild(rect) {
    this.doState('update', {
      rect,
    });
  }

  operateSelect(fn) {
    let top = this.state.rect;
    let parent = top;
    const parents = [];
    const path = this.state.path;
    for (let i = 0; i < path.length; i++) {
      if (parent.children.length <= path[i]) {
        return;
      }
      parents.push(parent);
      parent = parent.children[path[i]];
    }

    parent = fn(parents, parent);

    while (parents.length) {
      parent = parents.pop().updateChild(path[parents.length], parent);
    }
    this.doState('operate', {
      rect: parent,
    });
  }

  addSelect(rect) {
    this.operateSelect((parents, parent) => {
      return parent.addChild(rect);
    });
  }

  updateSelect(rect) {
    console.log("updateSelect", rect);
    this.operateSelect((parents, parent) => {
      return rect;
    });
  }

  removeSelect() {
    this.operateSelect((parents, parent) => {
      parents[parents.length - 1] = parents[parents.length - 1].removeChild(this.state.path[parents.length - 1]);
      return parents.pop();
    });
  }

  setEditorMeta(metaName, metaState) {
    if (metaState.animation) {
      this.doState('timeline', {
        meta: Object.assign({}, this.state.meta, metaState),
      });
    }
    this.setState({
      meta: Object.assign({}, this.state.meta, metaState),
    });
  }

  render() {
    const selectRect = this.getRect(this.state.path);
    return (
      <div>
        <div id="editRegion" style={{
          position: 'absolute',
          top: '20%',
          right: '33%',
          bottom: '0px',
          left: '0px',
        }}>
          <RectRender rect={this.state.rect} selectRect={this.selectRect} updateChild={this.updateChild} removeChild={noop} />
        </div>
        <div style={{
          position: 'absolute',
          top: '0px',
          right: '33%',
          bottom: '80%',
          left: '0px',
          overflow: 'hidden',
        }}>
          <RectTimeline rect={this.state.rect} animation={{}} meta={this.state.meta} updateRect={this.updateChild} setEditorMeta={this.setEditorMeta} />
        </div>
        <div style={{
          position: 'absolute',
          top: '0px',
          right: '16%',
          bottom: '0px',
          left: '67%',
        }}>
          <RectValues rect={selectRect} update={this.updateSelect} />
        </div>
        <div style={{
          position: 'absolute',
          top: '0px',
          right: '0px',
          bottom: '0px',
          left: '84%',
        }}>
          <RectHierarchy pasteMode={this.state.pasteMode} rect={this.state.rect} path={this.state.path} changePasteMode={this.changePasteMode} resetRect={this.resetRect} selectRect={this.selectRect} />
        </div>
      </div>
    );
  }
}

export default RectEditor;
