const {join} = require('path');

const FunctionCompilePlugin = require('boxart-webpack-plugin');

const {entries, htmlPlugins, svgPlugins} = require('./webpack.files');

module.exports = {
  context: __dirname,
  entry: entries(),
  output: {
    path: join(__dirname, 'dist'),
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: [
          /node_modules/,
          // Workaround webpack link reading. Normal use boxart is in
          // node_modules. In this repo, boxart is linked into node_modules and
          // webpack resolves that to its actual path.
          /\/boxart\/(src|lib)\/level0/,
        ],
        use: {
          loader: 'babel-loader',
          options: {
            presets: [['env', {
              modules: false,
              loose: true,
            }]],
          },
        },
      },
      {
        test: /\banimations\.js$/,
        use: FunctionCompilePlugin.buildTime(),
      },
    ],
  },
  plugins: [
    ...htmlPlugins(),
    ...svgPlugins(),
    new FunctionCompilePlugin(),
  ],
};
