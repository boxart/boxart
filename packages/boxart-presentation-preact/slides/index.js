const _slides = require.context('.');

module.exports = _slides.keys()
.filter(key => !/\.\/index\.js/.test(key) && /\.js$/.test(key))
.map(key => (console.log(key), _slides(key) && _slides(key).default || _slides(key)));
