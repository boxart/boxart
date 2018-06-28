import {h} from 'preact';

import {Render} from 'boxart-factory-preact';

export default <div class="slide 01-02 slide-title">
  <Render
    rect={require('../templates/title')}
    insert={{title: 'title'}}
    />
</div>;
