import {h, cloneElement} from 'preact';

import {RenderBox} from 'boxart-factory-preact';

export default ({children, class: className = ''}) => (
  cloneElement(children[0], {class: (children[0].attributes ? children[0].attributes.class : '') + ' ' + className})
);
