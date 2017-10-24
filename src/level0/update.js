if (process.env.BOXART_ENV === 'runtime') {
  module.exports = require('./update-ast').funcRegistry();
}
else if (process.env.BOXART_ENV === 'generated') {
  module.exports = require('../webpack/function-registry-loader!./update-ast');
}
else if (process.env.BOXART_ENV === 'compile') {
  module.exports = require('./update-ast');
}
else {
  module.exports = require('./update-manual');
}
