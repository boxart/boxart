const astRegistry = require('./ast-registry');
const _update = require('./update-ast.inner');

module.exports = astRegistry(_update);
