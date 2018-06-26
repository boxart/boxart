import {h} from 'preact';

import {Render} from 'boxart-factory-preact';

export default <div class="slide slide-out-left" style={{height: "100%", transform: "translate(-100%, 0)"}}>
  <Render
    rect={require('../templates/title')}
    insert={{title: 'title'}}
    />
</div>;
