import React from 'react';
import {render} from 'react-dom';

import BoxArt from 'boxart-react-dom';

import animations from './animations';

function Box({onClick}) {
  return <div
    className="box box1"
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
    this.state = {i: 0};
    this.swap = this.swap.bind(this);
  }

  swap() {
    this.setState({i: 1 - this.state.i});
  }

  render() {
    const {i} = this.state;
    const swap = this.swap;
    return (<div>
      <Column>
        {i === 0 ? <Box onClick={swap} /> : null}
      </Column>
      <Column>
        {i === 1 ? <Box onClick={swap} /> : null}
      </Column>
    </div>);
  }
}

render(<BoxArt animations={animations}>
  <App />
</BoxArt>, document.querySelector('#root'));
