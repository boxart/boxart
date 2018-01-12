import {cloneElement, Component} from 'react';

import MatchOwner from './react-match-owner';

const noop = () => {};

// const BoxartElement = function BoxartElement() {};
const BoxartElement = function BoxartElement() {};

// Wrap vdom of stateful Component extending classes with this to trigger ref
// being called before the component first renders. This way the component will
// be hooked before that happens.
const BoxartWrap = function BoxartWrap({hooked}) {
  // console.log(hooked.key);
  return hooked;
};

class ReactCrawler extends MatchOwner {
  constructor(bus, matcher) {
    super(matcher);

    this.bus = bus;
    this.change = bus.bind('state:change', 3);
    this.create = bus.bind('element:create', 3);
    this.update = bus.bind('element:update', 3);
    this.destroy = bus.bind('element:destroy', 2);
    this.componentCreate = bus.bind('component:create', 3);
    this.componentUpdate = bus.bind('component:update', 3);
    this.componentDestroy = bus.bind('component:destroy', 2);

    this.elementClaims = {};

    this.statelessMap = new WeakMap();
  }

  children(_children, path) {
    if (
      !_children ||
      Array.isArray(_children) && !_children.length
    ) {
      return _children;
    }
    if (!Array.isArray(_children)) {
      _children = [_children];
    }
    let children = _children;
    for (let i = 0, l = children.length; i < l; i++) {
      const child = children[i];
      const _node = child;
      const id = `${path}.${
        this.matchNode(_node) && this.matchId() ||
        _node.key || i
      }`;
      const node = this.inject(child, id);
      if (node !== child) {
        if (children === _children) {
          children = _children.slice();
        }
        children[i] = node;
      }
    }
    return children;
  }

  inject(node, path, root) {
    if (!node) {return node;}

    const isComponent = typeof node.type === 'function';
    if (isComponent) {
      if (node.type.prototype.render) {
        return this.cloneStateful(node, (component, render) => {
          this.statefulHook(component, render, path);
        });
      }
      else {
        return this.cloneStateless(node, path);
      }
    }
    else {
      const _children = node.props && node.props.children;
      const children = this.children(_children, path);
      if (node.props && node.props.className && this.matchNode(node)) {
        // const type = matchType();
        const type = this.matcher._match.type
        // const id = this.matchId();
        const id = this.matcher._match.id;

        // this.change(type, id, this.matchAnimation());
        this.change(type, id, this.matcher._match.animation);

        const lastClaim = this.elementClaims[id];
        this.elementClaims[id] = () => {refState = 2; return true;};
        let refState = (!lastClaim || !lastClaim()) ? 0 : 1;

        if (node.ref) {
          const _ref = node.ref;
          return this.cloneElement(node, children, element => {
            _ref(element);
            if (!element) {
              refState = this.elementRef(refState, type, id, element);
            }
            else {
              Promise.resolve()
              .then(() => {
                refState = this.elementRef(refState, type, id, element);
              });
            }
          });
        }
        else {
          return this.cloneElement(node, children, element => {
            if (!element) {
              refState = this.elementRef(refState, type, id, element);
            }
            else {
              Promise.resolve()
              .then(() => {
                refState = this.elementRef(refState, type, id, element);
              });
            }
          });
        }
      }
      else if (children !== _children) {
        return this.cloneElement(node, children);
      }
      else {
        return node;
      }
    }
  }

  cloneStateful(node, ref) {
    const clone = new BoxartElement();
    clone['$$typeof'] = node['$$typeof'];
    clone.type = node.type;
    clone.key = node.key;
    clone.ref = ref;
    clone.props = Object.assign({}, node.props);
    Object.defineProperty(clone.props, '__boxartRef', {
      value: ref,
    });
    clone._owner = node._owner;
    // clone.type = node.type;
    // clone.children = node.children;
    // clone.props = Object.assign({}, node.props);
    // clone.ref = ref;
    // clone.key = node.key;

    if (!node.type.__boxartCrawled) {
      node.type.__boxartCrawled = true;
      const _render = node.type.prototype.render;
      node.type.prototype.render = function() {
        if (this.props.__boxartRef) {
          this.props.__boxartRef(this, _render);
          this.__boxartCrawled = true;
          return this.render();
        }
        return _render.call(this);
      };
    }
    return clone;

    const trickster = new BoxartElement();
    trickster['$$typeof'] = node['$$typeof'];
    trickster.type = BoxartWrap;
    trickster.key = node.key;
    trickster.ref = null;
    trickster.props = {
      key: node.key,
      hooked: clone,
      // Easier to debug if you can see the wrapped type quicker in React
      // Tools.
      type: node.type,
    };
    trickster._owner = node._owner;

    // trickster.type = BoxartWrap;
    // trickster.children = null;
    // trickster.props = {
    //   key: node.key,
    //   hooked: clone,
    //   type: node.type,
    // };
    // trickster.key = node.key;

    return trickster;
  }

  statefulHook(component, _render, path) {
    if (component && !component.__boxartCrawled) {
      const componentPath = `${path}.${component.constructor.name}`;
      component.render = () => {
        return this.inject(_render.call(component), componentPath, true);
      };
      component.__boxartCrawled = true;
    }
  }

  cloneStateless(node, _path) {
    // const clone = cloneElement(node, null);
    const clone = new BoxartElement();
    clone['$$typeof'] = node['$$typeof'];
    clone.type = node.type;
    clone.key = node.key;
    clone.ref = null;
    clone._owner = node._owner;

    const path = `${_path}.${node.type.name}`;
    clone.type = this.statelessMap.get(node.type);
    if (!clone.type) {
      const ReactCrawlStateless = ({props, ref, type, path}, context) => {
        const pass = this.statelessHook(type, path, props, context);
        if (ref) {
          pass.ref = ref;
        }
        return pass;
      };
      clone.type = ReactCrawlStateless;
      this.statelessMap.set(node.type, ReactCrawlStateless);
    }

    clone.props = {
      props: node.props,
      type: node.type,
      ref: node.ref,
      path,
    };

    return clone;
  }

  statelessHook(type, path, a, b) {
    return this.inject(type(a, b), path, true);
  }

  cloneElement(node, children, ref) {
    const clone = new BoxartElement();
    clone['$$typeof'] = node['$$typeof'];
    clone.type = node.type;
    clone.key = node.key;
    clone.ref = ref || null;
    clone.props = Object.assign({}, node.props, {children});
    clone._owner = node._owner;

    return clone;
  }

  elementRef(refState, type, id, element) {
    switch (refState) {
    case 0:
      this.create(type, id, element);
      return 1;

    case 1:
      if (element) {
        this.update(type, id, element);
        return 1;
      }
      else {
        this.elementClaims[id] = null;
        this.destroy(type, id);
        return 2;
      }

    default:
      return 2;
    }
  }
}

export default ReactCrawler;
