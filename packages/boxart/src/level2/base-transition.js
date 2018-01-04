import MatchOwner from './match-owner';

class BaseTransition extends MatchOwner {
  constructor(bus, tree, matcher) {
    super(matcher);
    this.bus = bus;
    this.tree = tree;
  }

  can_(str, path, key) {
    const meta = this.tree.get(path).meta(key);
    if (meta.can) {
      return meta.can[str] || false;
    }
    return false;
  }

  canEnter(path, key) {
    return this.can_('enter', path, key);
  }

  canLeave(path, key) {
    return this.can_('leave', path, key);
  }

  didEnter(path, key) {
    const data = this.tree.get(path).meta(key);
    return data.didEnter;
  }

  didLeave(path, key) {
    const data = this.tree.get(path).meta(key);
    return data.didLeave;
  }
}

export default BaseTransition;
