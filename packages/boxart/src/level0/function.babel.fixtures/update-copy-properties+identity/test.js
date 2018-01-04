const babel = require('babel-core');
const {transform} = babel.default || babel;

const _plugin = require('../../function.babel');
const plugin = _plugin.default || _plugin;

const input = require('!!raw-loader!./index');
const expectOutput = require('!!raw-loader!./expect');

it(`babel plugin compiles - update-copy-properties+identity`, () => {
  const result = transform(input, {
    plugins: [plugin],
  });
  expect(result.code).toBe(expectOutput);
});
