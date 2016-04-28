import React from 'react';

import LinearStage from './linear-stage';
import CSSStage from './css-stage';

export default class LinearCSSStage extends LinearStage {
  render() {
    return (<CSSStage
      childShouldLeave={this.handleChildShouldLeave}
      index={this.state.index}
      {...this.props}>
      {this.props.children}
    </CSSStage>);
  }
}
