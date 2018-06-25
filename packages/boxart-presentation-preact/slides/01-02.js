import {h} from 'preact';

import {Render} from 'boxart-factory-preact';

export default <div class="slide slide-general-01-02" style={{height: "100%"}}>
  <Render
    rect={require('../templates/title')}
    insert={{title: 'title2'}}
    />
</div>;
