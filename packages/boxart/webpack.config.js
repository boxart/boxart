const webpack = require('webpack');
const webpackIf = require('webpack-if');

const FunctionCompilePlugin = require('./src/webpack/function-compile-plugin');

const {join} = require('path');

const dir = (...args) => join(__dirname, ...args);

const ifTest = webpackIf.ifElse(process.env.NODE_ENV === 'test');

module.exports = webpackIf({
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
      {
        test: /\.js$/,
        include: /node_modules\/preact\//,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['preact'],
          },
        },
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['preact'],
          },
        },
      },
      FunctionCompilePlugin.level0Rule(),
    ],
  },
  plugins: [
    new FunctionCompilePlugin(),
    ifTest(null, () => new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"production"',
    })),
  ],
});
