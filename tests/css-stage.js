import React, {Component} from 'react';
import {
  renderIntoDocument,
  findRenderedComponentWithType,
} from 'react-addons-test-utils';

import CSSStage from '../src/css-stage';

describe('CSSStage', function() {

  class Child extends Component {
    render() {return <div></div>;}
  }

  it('renders first child passed', function() {
    const scene = renderIntoDocument(<CSSStage
      transitionName="test-stage"
      transitionEnterTimeout={300}
      transitionLeaveTimeout={300}>
      <Child />
    </CSSStage>);
    const child = findRenderedComponentWithType(scene, Child);
    expect(child).to.be.ok;
  });

  it('renders index child passed', function() {
    const scene = renderIntoDocument(<CSSStage index={1}
      transitionName="test-stage"
      transitionEnterTimeout={300}
      transitionLeaveTimeout={300}>
      <Child value={0} key={0} />
      <Child value={1} key={1} />
    </CSSStage>);
    const child = findRenderedComponentWithType(scene, Child);
    expect(child.props.value).to.equal(1);
  });

});
