if (process.env.BOXART_ENV === 'runtime') {
  module.exports = require('./animate-ast').funcRegistry();
}
else if (process.env.BOXART_ENV === 'generated') {
  module.exports = require('!!babel-loader?{"presets":["env"]}!../webpack/function-registry-loader!./animate-ast');
}
else if (process.env.BOXART_ENV === 'compile') {
  module.exports = require('./animate-ast');
}
else {
  module.exports = require('./animate-manual');
}
