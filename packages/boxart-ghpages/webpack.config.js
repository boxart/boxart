module.exports = () => {
  const {join} = require('path');

  const HardSourcePlugin = require('hard-source-webpack-plugin');
  const HtmlPlugin = require('html-webpack-plugin');
  const MiniCssExtractPlugin = require('mini-css-extract-plugin');

  return {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          include: join(__dirname, 'src'),
          loader: 'babel-loader',
          options: {
            presets: [['env', {
              targets: {
                browsers: 'last 2 versions',
              },
              modules: false,
            }], 'preact'],
          },
        },
        {
          test: /\.md$/,
          loader: 'raw-loader',
        },
        {
          test: /\.css$/,
          use: [
            {
              loader: process.env.NODE_ENV === 'production' ?
                MiniCssExtractPlugin.loader :
                'style-loader',
            },
            {
              loader: 'css-loader'
            }
          ],
        },
      ],
    },
    plugins: [
      new HardSourcePlugin(),
      new HtmlPlugin({
        template: 'src/index.html.js',
      }),
      process.env.NODE_ENV === 'production' ?
        new MiniCssExtractPlugin() :
        null,
    ].filter(Boolean),
  };
};
