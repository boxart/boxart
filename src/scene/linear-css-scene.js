class LinearCSSScene extends LinearScene {
  render() {
    return (<CSSScene
      sceneFinished={this.handleSceneFinished}
      sceneIndex={this.state.index}>
      {this.props.children}
    </CSSScene>);
  }
}
