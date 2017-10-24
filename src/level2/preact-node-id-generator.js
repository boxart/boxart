import MatchOwner from './match-owner';

class PreactNodeIdGenerator extends MatchOwner {
  constructor(matcher) {
    super(matcher);
    this.isElement = this.isElement.bind(this);
    this.nodeId = this.nodeId.bind(this);
  }

  isElement(node) {
    return typeof node.nodeName === 'string';
  }

  nodeId(node) {
    if (typeof node.nodeName === 'string') {
      if (node.__boxartPreactMatchId) {
        return node.__boxartPreactMatchId;
      }
      if (this.matchNode(node)) {
        node.__boxartPreactMatchId = this.matchId();
        return node.__boxartPreactMatchId;
      }
    }
    else {
      return node.key;
    }
  }
}

export default PreactNodeIdGenerator;
