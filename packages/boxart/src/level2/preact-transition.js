import BaseTransition from './base-transition';

class PreactTransition extends BaseTransition {
  constructor(crawler, bus, tree, matcher) {
    super(bus, tree, matcher);

    this.nextDest = [];
    this.current = [];
    this.leaving = [];

    const _inject = crawler.inject.bind(crawler);
    crawler.inject = this.inject.bind(this, _inject);
    const _children = crawler.children.bind(crawler);
    crawler.children = this.children.bind(this, _children);
  }

  inject(crawlerInject, _node, path, root) {
    if (root) {
      const {parentBranch, parentKey: key} = this.tree.get(path);
      const id = this.tree.idGen.nodeId(_node);

      if (!parentBranch._meta[id || key] || !parentBranch._meta[key]) {
        this.tree.remove(path);
      }
      parentBranch.root(key, id, _node);

      const {parentKey: pkey, parentBranch: ppBranch} = parentBranch;
      ppBranch._meta[pkey] = parentBranch._meta[key] = parentBranch.meta(id);
      parentBranch.count = ppBranch.count;
    }
    return crawlerInject(_node, path);
  }

  children(crawlerChildren, _children, path) {
    const branch = this.tree.get(path);
    branch.update(_children, this.current, this.leaving);

    branch.count = (branch.count || 0) + 1;

    for (let i = 0; i < this.current.length; ++i) {
      branch.meta(this.current[i]).didLeave = false;
    }
    for (let i = 0; i < this.leaving.length; ++i) {
      if (branch.meta(this.leaving[i]).didLeave) {
        continue;
      }
      else if (this.canLeave(path, this.leaving[i])) {
        branch.meta(this.leaving[i]).didLeave = true;
      }
      else {
        branch.remove(this.leaving[i]);
      }
    }

    const result = branch.missedNodes(_children, this.nextDest);
    if (result === this.nextDest) {
      this.nextDest = [];
    }

    return crawlerChildren(result, path);
  }
}

export default PreactTransition;
