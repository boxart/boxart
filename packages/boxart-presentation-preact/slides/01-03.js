import {h} from 'preact';

import {Render} from 'boxart-factory-preact';

export default <div class="slide slide-01-03">
  <Render
    rect={require('../templates/title')}
    insert={{title: 'title3'}}
    />
</div>;
