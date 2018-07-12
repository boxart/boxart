import {h, render} from 'preact';

import {App} from './app';

import './index.css';
import 'highlight.js/styles/atom-one-light.css';

render(h(App), document.body, document.body.firstChild);
