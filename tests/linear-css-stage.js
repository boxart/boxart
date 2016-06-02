import React, {Component} from 'react';
import {
  renderIntoDocument,
  findRenderedComponentWithType,
} from 'react-addons-test-utils';

import LinearCSSStage from '../src/linear-css-stage';

describe('LinearCSSStage', function() {

  class Child extends Component {
    render() {return <div></div>;}
  }

  class ShouldLeave extends Component {
    componentDidMount() {this.props.shouldLeave();}
    render() {return <div></div>;}
  }

  it('renders first child passed', function() {
    const scene = renderIntoDocument(<LinearCSSStage
      transitionName="test-stage"
      transitionEnterTimeout={300}
      transitionLeaveTimeout={300}>
      <Child />
    </LinearCSSStage>);
    const child = findRenderedComponentWithType(scene, Child);
    expect(child).to.be.ok;
  });

  it('eventually renders second child passed', function() {
    const scene = renderIntoDocument(<LinearCSSStage
      transitionName="test-stage"
      transitionEnterTimeout={300}
      transitionLeaveTimeout={300}>
      <ShouldLeave value={0} key={0} />
      <Child value={1} key={1} />
    </LinearCSSStage>);
    const child = findRenderedComponentWithType(scene, Child);
    expect(child.props.value).to.equal(1);
  });

});
