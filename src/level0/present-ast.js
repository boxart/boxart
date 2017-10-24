const astRegistry = require('./ast-registry');
const _present = require('./present-ast.inner');

module.exports = astRegistry(_present);
