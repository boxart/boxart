import {h} from 'preact';

import {Render} from 'boxart-factory-preact';

export default <div class="slide 01-04 rotate-in-right">
  <Render
    rect={require('../templates/title')}
    insert={{title: ''}}
    />
</div>;
