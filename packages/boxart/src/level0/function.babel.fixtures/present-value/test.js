const babel = require('babel-core');
const {transform} = babel.default || babel;

const _plugin = require('../../function.babel');
const plugin = _plugin.default || _plugin;

const input = require('!!raw-loader!./index');
const expectOutput = require('!!raw-loader!./expect');

let _inputFuncName = 'unnamed';
try {
  const m = {exports: {}};
  new Function('module', 'exports', input)(m, m.exports);
  _inputFuncName = m.exports.name || _inputFuncName;
}
catch (e) {
  _inputFuncName = 'error evaluating';
}

it(`babel plugin compiles - ${_inputFuncName}`, () => {
  const result = transform(input, {
    plugins: [plugin],
  });
  expect(result.code).toBe(expectOutput);
});
