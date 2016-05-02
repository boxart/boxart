class CSSScene extends Scene {
  render() {
    return (<CSSTransitionGroup>
      {this.state.children}
    </CSSTransitionGroup>);
  }
}
