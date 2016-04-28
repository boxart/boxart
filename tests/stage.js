import React, {Component} from 'react';
import {render, findDOMNode} from 'react-dom';
import {
  renderIntoDocument,
  findRenderedComponentWithType
} from 'react-addons-test-utils';

import Stage from '../src/stage';

describe('Stage', function() {

  class Child extends Component {
    render() {return <div></div>;}
  }

  class TransitionItem extends Component {
    componentWillAppear(cb) {this.willAppearCalled = true; cb();}
    componentDidAppear() {this.didAppearCalled = true;}
    componentWillEnter(cb) {this.willEnterCalled = true; cb();}
    componentDidEnter() {this.didEnterCalled = true;}
    componentWillLeave(cb) {this.willLeaveCalled = true; cb();}
    componentDidLeave() {this.didLeaveCalled = true;}
    render() {return <div></div>;}
  }

  class StageSoon extends Component {
    constructor(props) {
      super(props);
      this.state = {children: null};
    }
    componentDidMount() {this.setState({children: this.props.children});}
    render() {return <Stage>{this.state.children}</Stage>;}
  }

  class ShouldLeave extends Component {
    componentDidMount() {this.props.shouldLeave();}
    render() {return <div></div>;}
  }

  it('renders first child passed', function() {
    const scene = renderIntoDocument(<Stage><Child></Child></Stage>);
    const child = findRenderedComponentWithType(scene, Child);
    expect(child).to.be.ok;
  });

  it('renders index child passed', function() {
    const scene = renderIntoDocument(<Stage index={1}>
      <Child value={0} key={0}></Child>
      <Child value={1} key={1}></Child>
    </Stage>);
    const child = findRenderedComponentWithType(scene, Child);
    expect(child.props.value).to.equal(1);
  });

  it('passes shouldLeave property to child', function() {
    const scene = renderIntoDocument(<Stage><Child></Child></Stage>);
    const child = findRenderedComponentWithType(scene, Child);
    expect(child.props.shouldLeave).to.be.a('function');
  });

  it('calls passed function to created child', function() {
    const scene = renderIntoDocument(<Stage>
      {({shouldLeave}) => {
        expect(shouldLeave).to.be.a('function');
        return <Child />;
      }}
    </Stage>);
  });

  it('calls componentWillAppear on rendered child', function() {
    const scene = renderIntoDocument(<Stage>
      <TransitionItem key={'item'} />
    </Stage>);
    const item = findRenderedComponentWithType(scene, TransitionItem);
    expect(item.willAppearCalled).to.be.ok;
  });

  it('calls componentDidAppear on rendered child', function() {
    const scene = renderIntoDocument(<Stage>
      <TransitionItem key={'item'} />
    </Stage>);
    const item = findRenderedComponentWithType(scene, TransitionItem);
    expect(item.didAppearCalled).to.be.ok;
  });

  it('calls componentWillEnter on rendered child', function() {
    let scene = renderIntoDocument(<Stage></Stage>);
    scene = render(
      <Stage><TransitionItem key={'item'} /></Stage>,
      findDOMNode(scene).parentNode
    );
    const item = findRenderedComponentWithType(scene, TransitionItem);
    expect(item.willEnterCalled).to.be.ok;
  });

  it('calls componentDidEnter on rendered child', function() {
    let scene = renderIntoDocument(<Stage></Stage>);
    scene = render(
      <Stage><TransitionItem key={'item'} /></Stage>,
      findDOMNode(scene).parentNode
    );
    const item = findRenderedComponentWithType(scene, TransitionItem);
    expect(item.didEnterCalled).to.be.ok;
  });

  it('calls componentWillLeave on rendered child', function() {
    let scene = renderIntoDocument(<Stage>
      <TransitionItem key={'item'} />
    </Stage>);
    const item = findRenderedComponentWithType(scene, TransitionItem);
    scene = render(<Stage></Stage>, findDOMNode(scene).parentNode);
    expect(item.willLeaveCalled).to.be.ok;
  });

  it('calls componentDidLeave on rendered child', function() {
    let scene = renderIntoDocument(<Stage>
      <TransitionItem key={'item'} />
    </Stage>);
    const item = findRenderedComponentWithType(scene, TransitionItem);
    scene = render(<Stage></Stage>, findDOMNode(scene).parentNode);
    expect(item.didLeaveCalled).to.be.ok;
  });

  it('calls passed childShouldLeave property', function() {
    const handleShouldLeave = sinon.spy();
    let scene = renderIntoDocument(
      <Stage childShouldLeave={handleShouldLeave}>
        <ShouldLeave key={'item'} />
      </Stage>
    );
    expect(handleShouldLeave.called).to.be.ok;
  });

  // it('calls passed childWillLeave property', function() {
  //   throw new Error();
  // });

  // it('calls passed childDidLeave property', function() {
  //   throw new Error();
  // });

});
