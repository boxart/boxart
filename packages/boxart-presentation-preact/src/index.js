import {h, render} from 'preact';

import Boxart from 'boxart-preact';

import animations from '../animations';
import slides from '../slides';

import './index.css';
import Presentation from './presentation';

render(<Boxart animations={animations}><Presentation>
  {slides}
</Presentation></Boxart>, document.getElementById('root'));
