import React from 'react';
import {render} from 'react-dom';

import BoxArt from 'boxart-react-dom';

import animations from './animations';

function Box({id, onClick}) {
  return <div
    data-id={id}
    className={`box box${id}`}
    style={{width: '100px', height: '100px', background: 'blue'}}
    onClick={onClick}
    />;
}

function Column({children}) {
  return <div style={{width: '100px', display: 'inline-block'}}>
    {children}
  </div>;
}

class App extends React.Component {
  constructor(...args) {
    super(...args);
    this.state = {columnA: ['00'], columnB: [], count: 0};
    this.addOrDelete = this.addOrDelete.bind(this);
    this.swap = this.swap.bind(this);
  }

  addOrDelete() {
    const {columnA, columnB, count} = this.state;
    if ((count % 8) < 4) {
      const column = ['columnA', 'columnB'][Math.floor(Math.random() * 2)];
      this.setState({
        [column]: this.state[column].concat(count.toString()),
        count: count + 1,
      });
    }
    else {
      let index = Math.floor(Math.random() * [...columnA, ...columnB].length);
      const column = index < columnA.length ? 'columnA' : 'columnB';
      index += index < columnA.length ? 0 : -columnA.length;
      this.setState({
        [column]:
          this.state[column].slice(0, index).concat(this.state[column].slice(index + 1)),
        count: count + 1,
      });
    }
  }

  swap(event) {
    const id = event.currentTarget.dataset.id;
    const column = this.state.columnA.indexOf(id) !== -1 ? 'columnA' : 'columnB';
    const index = this.state[column].indexOf(id);
    const otherColumn = column === 'columnA' ? 'columnB' : 'columnA';
    this.setState({
      [column]: this.state[column].slice(0, index).concat(this.state[column].slice(index + 1)),
      [otherColumn]: this.state[otherColumn].concat(id),
    });
    event.preventDefault();
    event.stopPropagation();
    return true;
  }

  render() {
    const {columnA, columnB} = this.state;
    const swap = this.swap;
    return (<div style={{position: 'absolute', top: 0, bottom: 0, left: 0, right: 0}} onClick={this.addOrDelete}>
      <Column>
        {columnA.map(id => <Box key={id} id={id} onClick={swap} />)}
      </Column>
      <Column>
        {columnB.map(id => <Box key={id} id={id} onClick={swap} />)}
      </Column>
    </div>);
  }
}

render(<BoxArt animations={animations}>
  <App />
</BoxArt>, document.querySelector('#root'));
