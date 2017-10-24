if (process.env.BOXART_ENV === 'runtime') {
  module.exports = require('./present-ast').funcRegistry();
}
else if (process.env.BOXART_ENV === 'generated') {
  module.exports = require('../webpack/function-registry-loader!./present-ast');
}
else if (process.env.BOXART_ENV === 'compile') {
  module.exports = require('./present-ast');
}
else {
  module.exports = require('./present-manual');
}
