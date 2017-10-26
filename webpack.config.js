const FunctionCompilePlugin = require('./src/webpack/function-compile-plugin');

const {join} = require('path');

const dir = (...args) => join(__dirname, ...args);

module.exports = {
  context: dir(),
  entry: {
    'animate': './src/level0/animate',
    'present': './src/level0/present',
    'update': './src/level0/update',
  },
  output: {
    path: dir('tmp/level0'),
    filename: '[name].js',
  },
  module: {
    rules: [
      FunctionCompilePlugin.level0Rule(),
    ],
  },
  plugins: [
    new FunctionCompilePlugin(),
  ],
};
