const webpack = require('webpack');

const FunctionCompilePlugin = require('./src/webpack/function-compile-plugin');

const {join} = require('path');

const dir = (...args) => join(__dirname, ...args);

module.exports = {
  context: dir(),
  entry: {
    // 'animate': './src/level0/animate',
    // 'present': './src/level0/present',
    // 'update': './src/level0/update',
    'animate.compile': './src/level0/animate.compile',
    'update.compile': './src/level0/update.compile',
    'present.compile': './src/level0/present.compile',
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
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"production"',
    }),
  ],
};
