import {h, Component, render} from 'preact';

import BoxArt from 'boxart-preact';

import animations from './animations';

function Box({onClick}) {
  return <div
    class="box box1"
    style={{width: '100px', height: '100px', background: 'blue'}}
    onClick={onClick}
    />;
}

function Column({children}) {
  return <div style={{width: '100px', display: 'inline-block'}}>
    {children}
  </div>;
}

class App extends Component {
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
    const res = (<div>
      <Column>
        {i === 0 ? <Box onClick={swap} /> : null}
      </Column>
      <Column>
        {i === 1 ? <Box onClick={swap} /> : null}
      </Column>
    </div>);
    return res;
  }
}

render(<BoxArt animations={animations}>
  <App />
</BoxArt>, document.querySelector('#root'));
