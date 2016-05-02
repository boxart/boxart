export default class LinearScene extends Component {
  constructor(props) {
    super(props);

    this.handleChildShouldLeave = this.handleChildShouldLeave.bind(this);
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

  handleChildShouldLeave() {
    this.setState({
      index: this.state.index + 1,
    });
  }

  render() {
    return (<Scene
      childShouldLeave={this.handleChildShouldLeave}
      index={this.state.index}>
      {this.props.children}
    </Scene>);
  }
}
