import BaseTransition from './base-transition';

import RunLoop from '../level1/runloop';

const falseFn = () => false;

class ReactElementTransition extends BaseTransition {
  constructor(bus, tree, matcher, loop) {
    super(bus, tree, matcher);
    this.loop = loop || RunLoop.main;

    this.alive = {};
    this.left = {};

    this.stateChange = this.bus.bind('state:change', 3);
    this.stateDestroy = this.bus.bind('state:destroy', 2);

    this.bus.on('state:begin', this.onStateBegin.bind(this));
    this.bus.on('state:end', this.onStateEnd.bind(this));
    this.bus.on('element:create', this.onElementCreate.bind(this));
    this.bus.on('element:update', this.onElementUpdate.bind(this));
    this.bus.on('element:destroy', this.onElementDestroy.bind(this));
  }

  onStateBegin(type, id, animation) {
    if (this.alive[id]) {
      this.alive[id](true);
    }
  }

  onStateEnd(type, id, animation) {
    if (animation === 'leave' && this.tree.element(id)) {
      Promise.race([
        new Promise(resolve => {this.alive[id] = resolve;}),
        this.loop.soon().then(falseFn),
      ])
      .then(alive => {
        this.alive[id] = null;
        if (!alive) {
          this.tree.element(id).remove(id);
          this.stateDestroy(type, id);
        }
      });
    }
  }

  onElementCreate(type, id, element) {
    const branch = this.tree.element(id);
    if (branch) {
      const meta = branch.meta(id);
      meta.can = this.matcher.results[type].hasAnimation;
      if (!meta.didEnter && meta.can.enter && branch.count > 1) {
        this.stateChange(type, id, 'enter');
      }
      meta.didEnter = true;
    }
  }

  onElementUpdate(type, id, element) {
    const branch = this.tree.element(id);
    if (branch) {
      const meta = branch.meta(id);
      if (!meta.can) {
        meta.can = this.matcher.results[type].hasAnimation;
      }
      if (meta.didLeave) {
        if (!meta.leaving) {
          meta._leaving = element.className;
          meta.leaving = `${element.className} leave`;
          this.left[id] = [meta.leaving, element.className];
        }

        element.className = meta.leaving;
        this.stateChange(type, id, 'leave');
      }
      else if (this.left[id]) {
        if (element.className === this.left[id][0]) {
          element.className = this.left[id][1];
        }
        this.left[id] = null;
        meta._leaving = null;
        meta.leaving = null;
      }
      if (!meta.didEnter && meta.can.enter && branch.count > 1) {
        this.stateChange(type, id, 'enter');
      }
      meta.didEnter = true;
    }
  }

  onElementDestroy(type, id, element) {
    if (this.left[id]) {
      this.left[id] = null;
    }
    if (this.tree.element(id)) {
      this.tree.element(id).remove(id);
    }
  }
}

export default ReactElementTransition;
