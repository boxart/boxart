import {h} from 'preact';

import {RenderBox} from 'boxart-factory-preact';

export default ({box, replace, insert}) => (
  <RenderBox box={box} replace={replace} insert={insert} />
);
