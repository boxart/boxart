import React, {Component} from 'react';

export default class StageItem extends Component {
  componentWillAppear(callback) {
    return this.props.willAppear && this.props.willAppear(callback);
  }

  componentDidAppear() {
    return this.props.didAppear && this.props.didAppear();
  }

  componentWillEnter(callback) {
    return this.props.willEnter && this.props.willEnter(callback);
  }

  componentDidEnter() {
    return this.props.didEnter && this.props.didEnter();
  }

  componentWillLeave(callback) {
    return this.props.willLeave && this.props.willLeave(callback);
  }

  componentDidLeave() {
    return this.props.didLeave && this.props.didLeave();
  }
}

StageItem.propTypes = {
  willAppear: React.PropTypes.func,
  didAppear: React.PropTypes.func,
  willEnter: React.PropTypes.func,
  didEnter: React.PropTypes.func,
  willLeave: React.PropTypes.func,
  didLeave: React.PropTypes.func,
};
