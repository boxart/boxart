class MatchOwner {
  constructor(matcher) {
    this.matcher = matcher;
  }

  matchNode(_node) {
    if (_node.__boxartPreactMatchType) {
      this.matcher._match.type = _node.__boxartPreactMatchType;
      this.matcher._match.id = _node.__boxartPreactMatchId;
      this.matcher._match.animation = _node.__boxartPreactMatchAnimation;
      return true;
    }
    if (typeof _node.nodeName === 'string') {
      const className = _node.attributes && _node.attributes.class;
      if (className && this.match(className)) {
        _node.__boxartPreactMatchType = this.matcher._match.type;
        _node.__boxartPreactMatchId = this.matcher._match.id;
        _node.__boxartPreactMatchAnimation = this.matcher._match.animation;
        return true;
      }
    }
    return false;
  }

  match(className) {
    return this.matcher.match(className);
  }

  matchType() {
    return this.matcher.matchType();
  }

  matchId() {
    return this.matcher.matchId();
  }

  matchAnimation() {
    return this.matcher.matchAnimation();
  }
}

export default MatchOwner;
