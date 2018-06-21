import {h, render} from 'preact';
import 'preact/devtools';

import RectEditor from './rect-editor';

console.log(document.getElementById('root'));
render(<RectEditor />, document.getElementById('root'));
