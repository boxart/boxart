import MatchOwner from './match-owner';

class ReactMatchOwner extends MatchOwner {
  matchNode(_node) {
    if (_node.__boxartReactMatchType) {
      this.matcher._match.type = _node.__boxartReactMatchType;
      this.matcher._match.id = _node.__boxartReactMatchId;
      this.matcher._match.animation = _node.__boxartReactMatchAnimation;
      return true;
    }
    if (typeof _node.type === 'string') {
      const className = _node.props && _node.props.className;
      if (className && this.match(className)) {
        // _node.__boxartReactMatchType = this.matcher._match.type;
        // _node.__boxartReactMatchId = this.matcher._match.id;
        // _node.__boxartReactMatchAnimation = this.matcher._match.animation;
        return true;
      }
    }
    return false;
  }
}

export default ReactMatchOwner;
