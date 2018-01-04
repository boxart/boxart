const {join} = require('path');

const webpack = require('webpack');

const dir = (...args) => join(__dirname, ...args);

module.exports = {
  context: dir(),
  entry: {
    'boxart-mutation-observer': './src/level3/mutation-observer',
    'boxart-mutation-observer-no0': './src/level3/mutation-observer-no0',
    'boxart-preact': './src/level3/preact',
    'boxart-preact-no0': './src/level3/preact-no0',
  },
  output: {
    path: dir('dist'),
    filename: '[name].[chunkhash].js',
    library: 'BoxArt',
    libraryTarget: 'umd',
  },
  externals: {
    preact: true,
    'preact/src/vnode': true,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [['env', {
                modules: false,
                loose: true,
              }]],
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin(),
  ],
};
