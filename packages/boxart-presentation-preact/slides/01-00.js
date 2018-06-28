import {h} from 'preact';

import {Render} from 'boxart-factory-preact';

import Slide from '../src/slide';

export default <div class="slide 01-01">
  <Render
    rect={require('../templates/title')}
    insert={{title: ''}}
    />
</div>;
