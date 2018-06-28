import {h} from 'preact';

import {Render} from 'boxart-factory-preact';

export default <div class="slide 02-01 slide-in-left">
  <Render
    rect={require('../templates/title')}
    insert={{title: 'title2'}}
    />
</div>;
