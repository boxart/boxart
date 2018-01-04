if (process.env.BOXART_ENV === 'compile') {
  module.exports = require('boxart/src/level0');
}
else {
  module.exports = require('boxart/lib/level0');
}
