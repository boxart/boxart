const HardSourcePlugin = require('hard-source-webpack-plugin');
const HtmlPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        include: [/boxart-presentation-preact/, /boxart-preact/, /boxart-factory-preact/],
        loader: 'babel-loader',
        options: {
          presets: [
            ['env', {modules: false}],
            'preact',
          ],
        },
      },
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader',
      },
    ],
  },
  plugins: [
    new HardSourcePlugin(),
    new HtmlPlugin({
      template: 'src/index.html.js',
    }),
  ],
};
