import MatchOwner from './react-match-owner';

class ReactNodeIdGenerator extends MatchOwner {
  constructor(matcher) {
    super(matcher);
    this.isElement = this.isElement.bind(this);
    this.nodeId = this.nodeId.bind(this);
  }

  isElement(node) {
    return typeof node.type === 'string';
  }

  nodeId(node) {
    if (typeof node.type === 'string') {
      if (this.matchNode(node)) {
        return this.matchId();
      }
    }
    else {
      return node.key;
    }
  }
}

export default ReactNodeIdGenerator;
