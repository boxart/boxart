import React, {Component} from 'react';
import {render, findDOMNode} from 'react-dom';
import {
  renderIntoDocument,
  scryRenderedComponentsWithType,
} from 'react-addons-test-utils';

import Batch from '../src/batch';
import BatchFactory from '../src/batch-factory';

describe('BatchFactory', function() {

  class Child extends Component {
    render() {return <div></div>;}
  }

  const keyGetter = item => item.key;

  function createStubChild() {
    class StubChild extends Component {}
    StubChild.prototype.render = sinon.stub();
    StubChild.prototype.render.returns(<div></div>);
    return StubChild;
  }

  function renderFactory(items, node, ChildConstructor = Child) {
    if (node) {
      return render(<BatchFactory items={items} itemKey={keyGetter} batchMax={1}>{(
      batchItems => <Batch items={batchItems} itemKey={keyGetter}>{(
        () => <ChildConstructor />
      )}</Batch>
    )}</BatchFactory>, findDOMNode(node).parentNode);
    }
    return renderIntoDocument(<BatchFactory items={items} itemKey={keyGetter} batchMax={1}>{(
      batchItems => <Batch items={batchItems} itemKey={keyGetter}>{(
        () => <Child />
      )}</Batch>
    )}</BatchFactory>);
  }

  function renderFactory2(items, node, ChildConstructor = Child) {
    if (node) {
      return render(<BatchFactory items={items} itemKey={keyGetter} batchMax={2}>{(
      batchItems => <Batch items={batchItems} itemKey={keyGetter}>{(
        item => <ChildConstructor itemKey={item.key} />
      )}</Batch>
    )}</BatchFactory>, findDOMNode(node).parentNode);
    }
    return renderIntoDocument(<BatchFactory items={items} itemKey={keyGetter} batchMax={2}>{(
      batchItems => <Batch items={batchItems} itemKey={keyGetter}>{(
        item => <ChildConstructor itemKey={item.key} />
      )}</Batch>
    )}</BatchFactory>);
  }

  function renderFactory3(items, node, ChildConstructor = Child) {
    if (node) {
      return render(<BatchFactory items={items} itemKey={keyGetter} batchMax={3}>{(
      batchItems => <Batch items={batchItems} itemKey={keyGetter}>{(
        () => <ChildConstructor />
      )}</Batch>
    )}</BatchFactory>, findDOMNode(node).parentNode);
    }
    return renderIntoDocument(<BatchFactory items={items} itemKey={keyGetter} batchMax={3}>{(
      batchItems => <Batch items={batchItems} itemKey={keyGetter}>{(
        () => <Child />
      )}</Batch>
    )}</BatchFactory>);
  }

  it('renders an empty items array', function() {
    renderFactory([]);
  });

  it('renders a new item added to a previously empty array', function() {
    const StubChild = createStubChild();

    let batchFactory = renderFactory([], null, StubChild);
    return Promise.resolve()
    .then(function() {
      batchFactory = renderFactory([{key: 'a'}], batchFactory, StubChild);
    })
    .then(function() {
      expect(StubChild.prototype.render).to.be.called.once;
      const children = scryRenderedComponentsWithType(batchFactory, StubChild);
      expect(children).to.have.length.of(1);
      const batches = scryRenderedComponentsWithType(batchFactory, Batch);
      expect(batches).to.have.length.of(2);
    });
  });

  it('renders an non-empty items array', function() {
    const items = [{key: 'a'}];
    const batchFactory = renderFactory(items);
    const children = scryRenderedComponentsWithType(batchFactory, Child);
    expect(children).to.have.length.of(1);
  });

  it('subdivides an items array', function() {
    const items = [{key: 'a'}, {key: 'b'}];
    const batchFactory = renderFactory(items);
    const children = scryRenderedComponentsWithType(batchFactory, Child);
    expect(children).to.have.length.of(2);
    const batches = scryRenderedComponentsWithType(batchFactory, Batch);
    expect(batches).to.have.length.of(3);
  });

  it('renders same unchanged subdivided items', function() {
    const items = [{key: 'a'}, {key: 'b'}];
    let batchFactory = renderFactory(items);
    const children = scryRenderedComponentsWithType(batchFactory, Child);
    expect(children).to.have.length.of(2);
    return Promise.resolve()
    .then(function() {
      batchFactory = renderFactory(items.slice(), batchFactory);
      const newChildren = scryRenderedComponentsWithType(batchFactory, Child);
      expect(newChildren).to.have.length.of(2);
    });
  });

  it('adds new batches for new items', function() {
    const items = [{key: 'a'}, {key: 'b'}, {key: 'c'}];
    let batchFactory = renderFactory2(items.slice(0, 2));
    return Promise.resolve()
    .then(function() {
      batchFactory = renderFactory2(items, batchFactory);

      const children = scryRenderedComponentsWithType(batchFactory, Child);
      expect(children).to.have.length.of(3);
      const batches = scryRenderedComponentsWithType(batchFactory, Batch);
      expect(batches).to.have.length.of(3);
    });
  });

  it('adds new items to old batches', function() {
    const items = [{key: 'a'}, {key: 'b'}, {key: 'c'}];
    let batchFactory = renderFactory2(items.slice(0, 1));
    return Promise.resolve()
    .then(function() {
      batchFactory = renderFactory2(items.slice(0, 2), batchFactory);

      const children = scryRenderedComponentsWithType(batchFactory, Child);
      expect(children).to.have.length.of(2);
      const batches = scryRenderedComponentsWithType(batchFactory, Batch);
      expect(batches).to.have.length.of(2);
    });
  });

  it('updates items at front of batch', function() {
    const items = [{key: 'a'}, {key: 'b'}, {key: 'c'}, {key: 'd'}];
    let batchFactory = renderFactory2(items.slice());
    return Promise.resolve()
    .then(function() {
      batchFactory = renderFactory2([items[0], items[1], {key: 'c'}, items[3]], batchFactory);

      const children = scryRenderedComponentsWithType(batchFactory, Child);
      expect(children).to.have.length.of(4);
      const batches = scryRenderedComponentsWithType(batchFactory, Batch);
      expect(batches).to.have.length.of(3);
    });
  });

  it('updates all items', function() {
    const items = [{key: 'a'}, {key: 'b'}, {key: 'c'}, {key: 'd'}];
    let batchFactory = renderFactory2(items.slice());
    return Promise.resolve()
    .then(function() {
      batchFactory = renderFactory2([{key: 'a'}, {key: 'b'}, {key: 'c'}, {key: 'd'}], batchFactory);

      const children = scryRenderedComponentsWithType(batchFactory, Child);
      expect(children).to.have.length.of(4);
      const batches = scryRenderedComponentsWithType(batchFactory, Batch);
      expect(batches).to.have.length.of(3);
    });
  });

  it('updates items at back of batch', function() {
    const items = [{key: 'a'}, {key: 'b'}, {key: 'c'}, {key: 'd'}];
    let batchFactory = renderFactory2(items.slice());
    return Promise.resolve()
    .then(function() {
      batchFactory = renderFactory2([items[0], {key: 'b'}, items[2], items[3]], batchFactory);

      const children = scryRenderedComponentsWithType(batchFactory, Child);
      expect(children).to.have.length.of(4);
      const batches = scryRenderedComponentsWithType(batchFactory, Batch);
      expect(batches).to.have.length.of(3);
    });
  });

  it('updates all items in larger batches', function() {
    const items = [{key: 'a'}, {key: 'b'}, {key: 'c'}, {key: 'd'}, {key: 'e'}, {key: 'f'}];
    let batchFactory = renderFactory3(items.slice());
    return Promise.resolve()
    .then(function() {
      batchFactory = renderFactory3([
        {key: 'a'}, {key: 'b'}, {key: 'c'}, {key: 'd'}, {key: 'e'}, {key: 'f'},
      ], batchFactory);

      const children = scryRenderedComponentsWithType(batchFactory, Child);
      expect(children).to.have.length.of(6);
      const batches = scryRenderedComponentsWithType(batchFactory, Batch);
      expect(batches).to.have.length.of(3);
    });
  });

  it('inserts new items to old batches', function() {
    const items = [{key: 'a'}, {key: 'b'}, {key: 'c'}];
    let batchFactory = renderFactory2(items.slice(1, 2));
    return Promise.resolve()
    .then(function() {
      batchFactory = renderFactory2(items.slice(0, 2), batchFactory);

      const children = scryRenderedComponentsWithType(batchFactory, Child);
      expect(children).to.have.length.of(2);
      const batches = scryRenderedComponentsWithType(batchFactory, Batch);
      expect(batches).to.have.length.of(2);
    });
  });

  it('inserts new batches', function() {
    const items = [{key: 'a'}, {key: 'b'}, {key: 'c'}];
    let batchFactory = renderFactory2(items.slice(1));
    return Promise.resolve()
    .then(function() {
      batchFactory = renderFactory2(items, batchFactory);

      const children = scryRenderedComponentsWithType(batchFactory, Child);
      expect(children, 'should create 3 children').to.have.length.of(3);
      const batches = scryRenderedComponentsWithType(batchFactory, Batch);
      expect(batches, 'should create 1 parent with two child batches').to.have.length.of(3);
    });
  });

  it('removes old items', function() {
    const items = [{key: 'a'}, {key: 'b'}, {key: 'c'}];
    let batchFactory = renderFactory2(items);
    return Promise.resolve()
    .then(function() {
      batchFactory = renderFactory2([items[0], items[2]], batchFactory);

      const children = scryRenderedComponentsWithType(batchFactory, Child);
      expect(children).to.have.length.of(2);
      const batches = scryRenderedComponentsWithType(batchFactory, Batch);
      expect(batches).to.have.length.of(3);
    });
  });

  it('removes old items', function() {
    const items = [{key: 'a'}, {key: 'b'}, {key: 'c'}];
    let batchFactory = renderFactory2(items);
    return Promise.resolve()
    .then(function() {
      batchFactory = renderFactory2(items.slice(1), batchFactory);

      const children = scryRenderedComponentsWithType(batchFactory, Child);
      expect(children).to.have.length.of(2);
      const batches = scryRenderedComponentsWithType(batchFactory, Batch);
      expect(batches).to.have.length.of(3);
    })
    .then(function() {
      batchFactory = renderFactory2(items.slice(1).concat(items[0]), batchFactory);

      const children = scryRenderedComponentsWithType(batchFactory, Child);
      expect(children).to.have.length.of(3);
      const batches = scryRenderedComponentsWithType(batchFactory, Batch);
      expect(batches).to.have.length.of(3);
    })
    .then(function() {
      batchFactory = renderFactory2([items[1], items[0]], batchFactory);

      const children = scryRenderedComponentsWithType(batchFactory, Child);
      expect(children).to.have.length.of(2);
      const batches = scryRenderedComponentsWithType(batchFactory, Batch);
      expect(batches).to.have.length.of(3);
    });
  });

  it('removes old items', function() {
    const items = [{key: 'a'}, {key: 'b'}, {key: 'c'}, {key: 'd'}, {key: 'e'}, {key: 'f'}];
    let batchFactory = renderFactory2(items);
    return Promise.resolve()
    .then(function() {
      batchFactory = renderFactory2([items[0], items[4], items[5]], batchFactory);

      const children = scryRenderedComponentsWithType(batchFactory, Child);
      expect(children).to.have.length.of(3);
      const batches = scryRenderedComponentsWithType(batchFactory, Batch);
      expect(batches).to.have.length.of(3);
    });
  });

  it('removes old items', function() {
    const items = [{key: 'a'}, {key: 'b'}, {key: 'c'}, {key: 'd'}, {key: 'e'}, {key: 'f'}];
    let batchFactory = renderFactory2(items);
    return Promise.resolve()
    .then(function() {
      batchFactory = renderFactory2([items[0], items[3]], batchFactory);

      const children = scryRenderedComponentsWithType(batchFactory, Child);
      expect(children).to.have.length.of(2);
      expect(children[1].props.itemKey).to.equal('d');
      const batches = scryRenderedComponentsWithType(batchFactory, Batch);
      expect(batches).to.have.length.of(3);
    });
  });

  it('removes old items', function() {
    const items = [{key: 'a'}, {key: 'b'}, {key: 'c'}, {key: 'd'}, {key: 'e'}, {key: 'f'}];
    let batchFactory = renderFactory2(items);
    return Promise.resolve()
    .then(function() {
      batchFactory = renderFactory2([items[0], items[1], items[4], items[5]], batchFactory);

      const children = scryRenderedComponentsWithType(batchFactory, Child);
      expect(children).to.have.length.of(4);
      const batches = scryRenderedComponentsWithType(batchFactory, Batch);
      expect(batches).to.have.length.of(3);
    });
  });

  it('removes old items', function() {
    const items = [{key: 'a'}, {key: 'b'}, {key: 'c'}, {key: 'd'}, {key: 'e'}, {key: 'f'}];
    let batchFactory = renderFactory2(items);
    return Promise.resolve()
    .then(function() {
      batchFactory = renderFactory2([items[1], items[2], items[4], items[5]], batchFactory);

      const children = scryRenderedComponentsWithType(batchFactory, Child);
      expect(children).to.have.length.of(4);
      const batches = scryRenderedComponentsWithType(batchFactory, Batch);
      expect(batches).to.have.length.of(4);
    });
  });

});
