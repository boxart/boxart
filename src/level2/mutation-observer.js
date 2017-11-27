class InnerMutationObserver {
  constructor({bus, loop, matcher}) {
    this.bus = bus;
    this.loop = loop;
    this.matcher = matcher;

    this.elements = {};
    this.elementRefs = {};

    this.change = bus.bind('state:change', 3);
    this.create = bus.bind('element:create', 3);
    this.update = bus.bind('element:update', 3);
    this.destroy = bus.bind('element:destroy', 2);

    this.onChildMutate = this.onChildMutate.bind(this);
    this.onClassMutate = this.onClassMutate.bind(this);
    this.childMutationObserver = new MutationObserver(this.onChildMutate);
    this.classMutationObserver = new MutationObserver(this.onClassMutate);
  }

  get childMutationInitOptions() {
    return {
      // Watch for new nodes to animate their first animation
      childList: true,

      // Watch everything under the observed node
      subtree: true,
    };
  }

  get classMutationInitOptions() {
    return {
      // Watch for class changes to key off new animations
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ['class'],

      // Watch everything under the observed node
      subtree: true,
    };
  }

  createNode(node) {
    if (this.matcher.match(node.className)) {
      this.change(this.matcher.matchType(), this.matcher.matchId(), this.matcher.matchAnimation());
      if (this.elements[this.matcher.matchId()]) {
        this.update(this.matcher.matchType(), this.matcher.matchId(), node);
        this.elementRefs[this.matcher.matchId()] += 1;
      }
      else {
        this.create(this.matcher.matchType(), this.matcher.matchId(), node);
        this.elementRefs[this.matcher.matchId()] = 1;
      }
      this.elements[this.matcher.matchId()] = node;
    }
  }

  destroyNode(node) {
    if (this.matcher.match(node.className)) {
      const type = this.matcher.matchType();
      const id = this.matcher.matchId();
      this.elementRefs[id] -= 1;
      this.loop.soon().then(() => {
        if (this.elementRefs[id] === 0) {
          this.destroy(type, id);
          delete this.elements[id];
          delete this.elementRefs[id];
        }
      });
    }
  }

  onChildMutate(mutations) {
    for (let i = 0, l = mutations.length; i < l; i++) {
      const record = mutations[i];
      for (let j = 0, m = record.addedNodes.length; j < m; j++) {
        this.createNode(record.addedNodes[j]);
      }
      for (let j = 0, m = record.removedNodes.length; j < m; j++) {
        this.destroyNode(record.removedNodes[j]);
      }
    }
  }

  onClassMutate(mutations) {
    for (let i = 0, l = mutations.length; i < l; i++) {
      const record = mutations[i];
      if (record.target.className !== record.oldValue) {
        if (this.matcher.match(record.target.className)) {
          this.change(this.matcher.matchType(), this.matcher.matchId(), this.matcher.matchAnimation());
        }
      }
    }
  }

  observe(target) {
    this.childMutationObserver.observe(target, this.childMutationInitOptions);
    this.classMutationObserver.observe(target, this.classMutationInitOptions);

    for (const key in this.animations) {
      const nodes = target.getElementsByClassName(key);
      for (let i = 0; i < nodes.length; i++) {
        this.createNode(nodes[i]);
      }
    }
  }

  disconnect() {
    this.childMutationObserver.disconnect();
    this.classMutationObserver.disconnect();

    // ... destroy all still existing nodes
  }
}

export default InnerMutationObserver;
