import inOrderUnion from './in-order-union';

class TransitionList {
  constructor(tree, path, idGen) {
    const index = path.lastIndexOf('.');
    this.parentPath = path.substring(0, index);
    this.parentKey = path.substring(index + 1);
    this.path = path;
    this.tree = tree;

    this.order = [];
    this.missed = null;
    this._tmpOrder = [];
    this._tmp2Order = [];
    this._dirtyOrder = false;
    this.mustAddNodes = false;

    this.indices = [];

    this.nodes = {};
    this._meta = {};

    this.isElement = idGen.isElement;
    this.nodeId = idGen.nodeId;
  }

  meta(key) {
    if (!this._meta[key]) {
      this._meta[key] = {};
    }
    return this._meta[key];
  }

  remove(key) {
    if (!this.nodes[key]) {
      return;
    }

    const node = this.nodes[key];

    this.nodes[key] = null;
    this._meta[key] = null;
    this._dirtyOrder = true;

    if (node && this.isElement(node) && this.nodeId(node)) {
      this.tree.setElementPath(key, null);
    }

    if (this.isRoot) {
      for (let i = 0; i < this.order.length; ++i) {
        this.tree.remove(`${this.path}.${this.order[i]}`);
      }
      this.tree.remove(this.path, this.isRoot);
    }
    else {
      this.tree.remove(`${this.path}.${key}`);
    }
  }

  root(key, id, node) {
    this._updateOrder();
    if (!this.nodes[id || key] || !this.nodes[key]) {
      for (let i = 0; i < this.order.length; ++i) {
        this.remove(this.order[i]);
      }
    }
    this.nodes[id || key] = node;
    this.nodes[key] = node;
    this.order.length = 0;
    this.order[0] = key;
    this.order[1] = id;
    this.isRoot = true;

    if (this.isElement(node) && id) {
      this.tree.setElementPath(id, this.path);
    }
  }

  _updateOrder() {
    if (this._dirtyOrder) {
      for (let i = this.order.length - 1; i >= 0; --i) {
        if (!this.nodes[this.order[i]]) {
          this.order.splice(i, 1);
        }
      }

      this._dirtyOrder = false;
    }
  }

  update(src, current, missed) {
    current.length = 0;
    missed.length = 0;
    this._tmpOrder.length = 0;
    this.missed = missed;
    this._updateOrder();

    const newOrder = this._tmpOrder;
    if (src) {
      for (let i = 0; i < src.length; ++i) {
        const id = this.nodeId(src[i]);
        if (id) {
          current[i] = id;
          newOrder[i] = id;

          this.nodes[id] = src[i];
          if (this.isElement(src[i])) {
            this.tree.setElementPath(id, this.path);
          }
        }
        else {
          current[i] = i;
          newOrder[i] = i;
          this.nodes[i] = src[i];
        }
      }
    }

    const unionResult = inOrderUnion(this.order, newOrder, this._tmp2Order, missed);
    // Same order, no new or missing nodes
    // Don't need to swap order lists
    
    // Different order or new nodes
    if (unionResult === this._tmpOrder) {
      const tmp = this._tmpOrder;
      this._tmpOrder = this.order;
      this.order = tmp;
    }
    // Missing old nodes
    else if (unionResult === this._tmp2Order) {
      const tmp = this._tmp2Order;
      this._tmp2Order = this.order;
      this.order = tmp;
    }
  }

  missedNodes(src, dest) {
    for (let i = this.missed.length - 1; i >= 0; --i) {
      if (!this.nodes[this.missed[i]]) {
        this.missed.splice(i, 1);
      }
    }

    if (this.missed.length === 0) {
      return src;
    }

    this._updateOrder();

    dest.length = this.order.length;
    for (let i = 0; i < this.order.length; ++i) {
      dest[i] = this.nodes[this.order[i]];
    }

    return dest;
  }
}

class TransitionTree {
  constructor(idGen) {
    this.idGen = idGen;
    this.lists = {};
    this.elementPaths = {};
  }

  get(path) {
    if (!this.lists[path]) {
      this.lists[path] = new TransitionList(this, path, this.idGen);
      if (this.lists[path]) {
        this.lists[path].parentBranch = this.get(this.lists[path].parentPath);
      }
    }
    return this.lists[path];
  }

  element(id) {
    return this.lists[this.elementPaths[id]];
  }

  remove(path, root) {
    if (this.lists[path]) {
      const branch = this.lists[path];
      const order = branch.order;
      for (let i = 0, l = order.length; i < l; ++i) {
        if (branch.nodes[order[i]]) {
          branch.remove(order[i]);
        }
      }
    }
    const parent = path.substring(0, path.lastIndexOf('.'));
    const key = path.substring(path.lastIndexOf('.') + 1);
    if (root && this.lists[parent] && this.lists[parent].nodes[key]) {
      this.lists[parent].remove(key);
    }
    this.lists[path] = null;
  }

  setElementPath(id, path) {
    if (this.element(id) && this.elementPaths[id] !== path && this.element(id).nodes[id]) {
      this.element(id).remove(id);
    }
    this.elementPaths[id] = path;
  }
}

export default TransitionTree;
