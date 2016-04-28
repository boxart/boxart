export default class LinearScene extends Component {
  constructor(props) {
    super(props);

    this.handleSceneFinished = this.handleSceneFinished.bind(this);
    this.state = this.handleProps(props);
  }

  componentWillReceiveProps(newProps) {
    if (this.props !== newProps) {
      this.setState(this.handleProps(props));
    }
  }

  handleProps(props) {
    return {index: 0};
  }

  handleSceneFinished() {
    this.setState({
      index: this.state.index + 1,
    });
  }

  render() {
    return (<Scene
      sceneFinished={this.handleSceneFinished}
      sceneIndex={this.state.index}>
      {this.props.children}
    </Scene>);
  }
}
