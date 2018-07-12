import {h} from 'preact';
import {render} from 'preact-render-to-string';

import {App} from './app';

export default `<html>
<head></head>
<body>${render(h(App))}</body>
</html>`;
