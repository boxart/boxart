import BaseTransition from './base-transition';

class PreactComponentTransition extends BaseTransition {
  constructor(bus, tree, matcher) {
    super(bus, tree, matcher);
    this.bus = bus;
    this.components = {};

    this.stateChange = this.bus.bind('state:change', 3);

    // this.bus.on('state:end', this.onStateEnd.bind(this));
    // this.bus.on('element:create', this.onElementCreate.bind(this));
    // this.bus.on('element:update', this.onElementUpdate.bind(this));
    // this.bus.on('component:create', this.onComponentCreate.bind(this));
    // this.bus.on('component:destroy', this.onComponentDestroy.bind(this));
  }

  // inject(_inject, node, path) {
  //   return _inject()
  // }
  //
  // onStateEnd(type, id, animation) {
  //   const branch = this.tree.element(id);
  //   if (animation === 'leave' && branch && this.components[branch.path]) {
  //     const {path, key} = this.components[branch.path];
  //     this.tree.get(path).remove(key);
  //   }
  // }
  //
  // onElementCreate(type, id, element) {
  //   const branch = this.tree.element(id);
  //   console.log('onElementCreate', id, branch && branch.path, branch && branch.meta(id));
  //   if (branch && this.components[branch.path]) {
  //     const {path, key} = this.components[branch.path];
  //     const meta = this.tree.get(path).meta(key);
  //     meta.type = type;
  //     meta.can = this.matcher.results[type].hasAnimation;
  //   }
  // }
  //
  // onElementUpdate(type, id, element) {
  //   const branch = this.tree.element(id);
  //   if (branch && this.components[branch.path]) {
  //     const {path, key} = this.components[branch.path];
  //     const meta = this.tree.get(path).meta(key);
  //     if (meta.didLeave && !meta.leaving) {
  //       meta.leaving = `${element.className} leave`;
  //       this.stateChange(type, id, 'leave');
  //     }
  //     if (meta.leaving) {
  //       element.className = meta.leaving;
  //     }
  //   }
  // }
  //
  // onComponentCreate(path, key, component) {
  //   const meta = this.tree.get(path).meta(key);
  //   this.components[`${path}.${key}`] = {path, key};
  //   // console.log('onComponentCreate', path, key, this.tree.get(`${path}.${key}`));
  // }
  //
  // onComponentDestroy(path, key, component) {
  //   this.components[`${path}.${key}`] = null;
  // }
}

export default PreactComponentTransition;
