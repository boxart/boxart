import {h} from 'preact';

import {Render} from 'boxart-factory-preact';

export default <div class="slide 01-04" style={{height: "100%"}}>
  <Render
    rect={require('../templates/title')}
    insert={{title: 'title3'}}
    />
</div>;
