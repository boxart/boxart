import {cloneElement, Component, h} from 'preact';
import {VNode} from 'preact/src/vnode';

import MatchOwner from './match-owner';

const noop = () => {};

// const BoxartVNode = function BoxartVNode() {};
const BoxartVNode = VNode;

// Wrap vdom of stateful Component extending classes with this to trigger ref
// being called before the component first renders. This way the component will
// be hooked before that happens.
const BoxartWrap = function BoxartWrap({hooked}) {
  // console.log(hooked.key);
  return hooked;
};

class PreactCrawler extends MatchOwner {
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
    if (!_children || !_children.length) {return _children;}
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

    const isComponent = typeof node.nodeName === 'function';
    if (isComponent) {
      if (node.nodeName.prototype.render) {
        // console.log(node.nodeName.name, 'Component');
        if (node.attributes && node.attributes.ref) {
          const _ref = node.attributes && node.attributes.ref;
          return this.cloneStateful(node, component => {
            _ref(component);
            this.statefulHook(component, path);
          });
        }
        else {
          return this.cloneStateful(node, component => {
            this.statefulHook(component, path);
          });
        }
      }
      else {
        return this.cloneStateless(node, path);
      }
    }
    else {
      const _children = node.children;
      const children = this.children(_children, path);
      if (node.attributes && node.attributes.class && this.matchNode(node)) {
        // const type = matchType();
        const type = this.matcher._match.type
        // const id = this.matchId();
        const id = this.matcher._match.id;

        // this.change(type, id, this.matchAnimation());
        this.change(type, id, this.matcher._match.animation);

        const lastClaim = this.elementClaims[id];
        this.elementClaims[id] = () => {refState = 2; return true;};
        let refState = (!lastClaim || !lastClaim()) ? 0 : 1;

        if (node.attributes && node.attributes.ref) {
          const _ref = node.attributes && node.attributes.ref;
          return this.cloneElement(node, children, element => {
            _ref(element);
            if (element) {
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
            if (element) {
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
    const clone = new BoxartVNode();
    clone.nodeName = node.nodeName;
    clone.children = node.children;
    clone.attributes = Object.assign({}, node.attributes);
    clone.attributes.ref = ref;
    clone.key = node.key;

    const trickster = new BoxartVNode();
    trickster.nodeName = BoxartWrap;
    trickster.children = null;
    trickster.attributes = {
      key: node.key,
      hooked: clone,
      // Easier to debug if you can see the wrapped nodeName quicker in React
      // Tools.
      nodeName: node.nodeName,
    };
    trickster.key = node.key;

    return trickster;
  }

  statefulHook(component, path) {
    if (component && component.render && !component.render.crawled) {
      const componentPath = `${path}.${component.constructor.name}`;
      const _render = component.render;
      component.render = (props, state, context) => {
        return this.inject(_render.call(component, props, state, context), componentPath, true);
      };
      component.render.crawled = true;
    }
  }

  cloneStateless(node, _path) {
    // const clone = cloneElement(node, null);
    const clone = new BoxartVNode();

    const path = `${_path}.${node.nodeName.name}`;
    clone.nodeName = this.statelessMap.get(node.nodeName);
    if (!clone.nodeName) {
      const PreactCrawlStateless = ({props, nodeName, path}, context) => {
        return this.statelessHook(nodeName, path, props, context);
      };
      clone.nodeName = PreactCrawlStateless;
      this.statelessMap.set(node.nodeName, PreactCrawlStateless);
    }

    clone.children = node.children;
    clone.attributes = {
      props: node.children ?
        Object.assign({}, node.attributes, {children: node.children}) :
        node.attributes,
      nodeName: node.nodeName,
      path,
    };
    clone.key = node.key;

    return clone;
  }

  statelessHook(nodeName, path, a, b) {
    return this.inject(nodeName(a, b), path, true);
  }

  cloneElement(node, children, ref) {
    const clone = new BoxartVNode();

    clone.nodeName = node.nodeName;
    clone.children = children;
    clone.attributes = Object.assign({}, node.attributes);
    if (ref) {
      clone.attributes.ref = ref;
    }
    clone.key = node.key;

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

export default PreactCrawler;
