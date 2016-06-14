import React, {Component} from 'react';
import {render, findDOMNode} from 'react-dom';
import {
  renderIntoDocument,
  scryRenderedComponentsWithType,
} from 'react-addons-test-utils';

import Batch from '../src/batch';

describe('Batch', function() {

  class Child extends Component {
    render() {return <div></div>;}
  }

  const keyGetter = item => item.key;

  it('renders an empty items array', function() {
    renderIntoDocument(<Batch items={[]} itemKey={keyGetter}>{() => <Child />}</Batch>);
  });

  it('renders a new item added to a previously empty array', function() {
    class StubChild extends Component {}
    StubChild.prototype.render = sinon.stub();
    StubChild.prototype.render.returns(<div></div>);

    let batch = renderIntoDocument(<Batch items={[]} itemKey={keyGetter}>{() => <StubChild />}</Batch>);
    return Promise.resolve()
    .then(function() {
      batch = render(
        <Batch items={[{key: 'a'}]} itemKey={keyGetter}>{() => <StubChild />}</Batch>,
        findDOMNode(batch).parentNode
      );
    })
    .then(function() {
      expect(StubChild.prototype.render).to.be.called.once;
    });
  });

  it('renders an non-empty items array', function() {
    const items = [{key: 'a'}];
    renderIntoDocument(<Batch items={items} itemKey={keyGetter}>{() => <Child />}</Batch>);
  });

  it('renders no changes if items stayed the same', function() {
    class StubChild extends Component {}
    StubChild.prototype.render = sinon.stub();
    StubChild.prototype.render.returns(<div></div>);

    const items = [{key: 'a'}];
    let batch = renderIntoDocument(
      <Batch items={items} itemKey={keyGetter}>{() => <StubChild />}</Batch>
    );
    return Promise.resolve()
    .then(function() {
      batch = render(
        <Batch items={items} itemKey={keyGetter}>{() => <StubChild />}</Batch>,
        findDOMNode(batch).parentNode
      );
    })
    .then(function() {
      expect(StubChild.prototype.render).to.be.called.once;
    });
  });

  it('renders updates if items do not stay the same', function() {
    class StubChild extends Component {}
    StubChild.prototype.render = sinon.stub();
    StubChild.prototype.render.returns(<div></div>);

    const items = [{key: 'a'}];
    let batch = renderIntoDocument(
      <Batch items={items} itemKey={keyGetter}>{() => <StubChild />}</Batch>
    );
    return Promise.resolve()
    .then(function() {
      batch = render(
        <Batch items={[{key: 'a'}]} itemKey={keyGetter}>{() => <StubChild />}</Batch>,
        findDOMNode(batch).parentNode
      );
    })
    .then(function() {
      expect(StubChild.prototype.render).to.be.called.twice;
    });
  });

  it('renders an array and then updates when given less items', function() {
    const items = [{key: 'a'}];
    let batch = renderIntoDocument(
      <Batch items={items} itemKey={keyGetter}>{() => <Child />}</Batch>
    );
    return Promise.resolve()
    .then(function() {
      const children = scryRenderedComponentsWithType(batch, Child);
      expect(children).to.have.length(1);
    })
    .then(function() {
      batch = render(
        <Batch items={[]} itemKey={keyGetter}>{() => <Child />}</Batch>,
        findDOMNode(batch).parentNode
      );
    })
    .then(function() {
      const children = scryRenderedComponentsWithType(batch, Child);
      expect(children).to.have.length(0);
    });
  });

  it('renders the same copy in a different place if identical', function() {
    const items = [{key: 'a'}, {key: 'b'}];
    let batch = renderIntoDocument(
      <Batch items={items} itemKey={keyGetter}>{() => <Child />}</Batch>
    );
    let children;
    return Promise.resolve()
    .then(function() {
      children = scryRenderedComponentsWithType(batch, Child);
      expect(children).to.have.length.of(2);
    })
    .then(function() {
      batch = render(
        <Batch items={[items[1], items[0]]} itemKey={keyGetter}>{() => <Child />}</Batch>,
        findDOMNode(batch).parentNode
      );
    })
    .then(function() {
      const newChildren = scryRenderedComponentsWithType(batch, Child);
      expect(newChildren[0]).to.equal(children[1]);
      expect(newChildren[1]).to.equal(children[0]);
    });
  });

  it('renders a new copy instead of an old one if removed', function() {
    const items = [{key: 'a'}];
    let batch = renderIntoDocument(
      <Batch items={items} itemKey={keyGetter}>{() => <Child />}</Batch>
    );
    let children;
    return Promise.resolve()
    .then(function() {
      children = scryRenderedComponentsWithType(batch, Child);
    })
    .then(function() {
      batch = render(
        <Batch items={[]} itemKey={keyGetter}>{() => <Child />}</Batch>,
        findDOMNode(batch).parentNode
      );
    })
    .then(function() {
      batch = render(
        <Batch items={items} itemKey={keyGetter}>{() => <Child />}</Batch>,
        findDOMNode(batch).parentNode
      );
    })
    .then(function() {
      const newChildren = scryRenderedComponentsWithType(batch, Child);
      expect(newChildren[0]).to.not.equal(children[0]);
    });
  });

});
