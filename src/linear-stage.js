import React, {Component} from 'react';

import Stage from './stage';

export default class LinearStage extends Component {
  constructor(props) {
    super(props);

    this.handleChildShouldLeave = this.handleChildShouldLeave.bind(this);
    this.state = this.handleProps(props);
  }

  componentWillReceiveProps(newProps) {
    if (this.props !== newProps) {
      this.setState(this.handleProps(newProps));
    }
  }

  shouldComponentUpdate(newProps, newState) {
    return this.state !== newState;
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
    return (<Stage
      childShouldLeave={this.handleChildShouldLeave}
      index={this.state.index}>
      {this.props.children}
    </Stage>);
  }
}

LinearStage.propTypes = {
  children: React.PropTypes.any,
};
