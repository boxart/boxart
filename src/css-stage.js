import React from 'react';
import CSSTransitionGroup from 'react-addons-css-transition-group';

import Stage from './stage';

export default class CSSStage extends Stage {
  render() {
    return (<CSSTransitionGroup {...this.props}>
      {this.state.children}
    </CSSTransitionGroup>);
  }
}
